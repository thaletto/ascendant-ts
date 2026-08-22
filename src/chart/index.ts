import { Context, Effect, Layer, pipe, Schema } from "effect";
import * as Swisseph from "@swisseph/node";
import {
  Chart,
  ChartCalculation,
  ChartCalculationError,
  Division,
  House,
  Houses,
  Lagna,
  LocatedMoment,
  Planet,
  Placements,
  Rashis,
  Sign,
  SourceLagna,
  SourcePlanet,
} from "../types";
import { inSignStatus, nakshatraOf, SIGN_LORDS } from "../const/tables";
import { Ephemeris } from "../ephemeris/service";
import { AstroParams } from "../config/astro-params";
import { getDivisionalTarget, normalizeLongitude } from "./divisional-mapping";

const BODY_ENTRIES = [
  ["Sun", Swisseph.Planet.Sun],
  ["Moon", Swisseph.Planet.Moon],
  ["Mars", Swisseph.Planet.Mars],
  ["Mercury", Swisseph.Planet.Mercury],
  ["Venus", Swisseph.Planet.Venus],
  ["Jupiter", Swisseph.Planet.Jupiter],
  ["Saturn", Swisseph.Planet.Saturn],
  ["Rahu", Swisseph.LunarPoint.TrueNode],
] as const;

const SUPPORTED_DIVISIONS = new Set<number>(Division.literals);

class MissingPlacementError extends Schema.TaggedError<MissingPlacementError>()(
  "MissingPlacementError",
  {
    placement: Schema.Literal("Rahu"),
  },
) {}

const isValidInput = (input: LocatedMoment): boolean =>
  Number.isFinite(input.latitude) &&
  input.latitude >= -90 &&
  input.latitude <= 90 &&
  Number.isFinite(input.longitude) &&
  input.longitude >= -180 &&
  input.longitude <= 180 &&
  Number.isFinite(input.moment.date.getTime());

const normalizeDivisions = (
  requested: readonly number[],
): Effect.Effect<
  readonly [typeof Division.Type, ...(typeof Division.Type)[]],
  ChartCalculationError
> => {
  const unsupported = requested.find((division) => !SUPPORTED_DIVISIONS.has(division));
  if (unsupported !== undefined) {
    return Effect.fail(
      new ChartCalculationError({
        stage: "validation",
        message: `Division D${unsupported} is not supported`,
        cause: unsupported,
      }),
    );
  }

  return Effect.succeed(
    [...new Set([1, ...requested])].sort((left, right) => left - right) as [
      typeof Division.Type,
      ...(typeof Division.Type)[],
    ],
  );
};

const sign = (name: typeof Rashis.Type): Sign => new Sign({ name, lord: SIGN_LORDS[name] });

const chartFromMappedPlacements = ({
  division,
  lagna,
  planets,
}: {
  readonly division: typeof Division.Type;
  readonly lagna: Lagna;
  readonly planets: readonly Planet[];
}): Chart => {
  const houses = {} as Record<typeof Houses.Type, House>;
  const lagnaSignIndex = Rashis.literals.indexOf(lagna.sign.name);
  for (let index = 0; index < 12; index++) {
    const house = (index + 1) as typeof Houses.Type;
    const houseSign = Rashis.literals[(lagnaSignIndex + index) % 12]!;
    houses[house] = new House({
      sign: houseSign,
      planets: planets.filter((planet) => planet.sign.name === houseSign),
      lagna: house === 1 ? lagna : null,
    });
  }

  return new Chart({ division, houses });
};

const chartFromPlacements = Effect.fn("ChartService.chartFromPlacements")(function* (
  placements: Placements,
  division: typeof Division.Type,
) {
  const lagna = yield* getDivisionalTarget(placements.lagna.longitude, division).pipe(
    Effect.map((mapped) => {
      const mappedSign = Rashis.literals[mapped.signIndex]!;
      return new Lagna({
        name: "Lagna",
        longitude: mapped.longitude,
        degree: mapped.degree,
        sign: sign(mappedSign),
      });
    }),
  );

  const planets = yield* Effect.all(
    placements.planets.map((source) =>
      getDivisionalTarget(source.longitude, division).pipe(
        Effect.map((mapped) => {
          const mappedSign = Rashis.literals[mapped.signIndex]!;
          return new Planet({
            name: source.name,
            longitude: mapped.longitude,
            degree: mapped.degree,
            is_retrograde: source.is_retrograde,
            in_sign: [...inSignStatus(source.name, mappedSign, mapped.degree)],
            sign: sign(mappedSign),
          });
        }),
      ),
    ),
    { concurrency: "unbounded" },
  );

  return pipe({ division, lagna, planets }, chartFromMappedPlacements);
});

export class ChartService extends Context.Service<
  ChartService,
  {
    readonly generate: (
      input: LocatedMoment,
      divisions?: readonly number[],
    ) => Effect.Effect<ChartCalculation, ChartCalculationError>;
  }
>()("@app/ChartService") {
  static readonly layer = Layer.effect(
    ChartService,
    Effect.gen(function* () {
      const ephemeris = yield* Ephemeris;
      const astroParams = yield* AstroParams;

      const generate = Effect.fn("ChartService.generate")(function* (
        input: LocatedMoment,
        divisions: readonly number[] = [],
      ) {
        if (!isValidInput(input)) {
          return yield* new ChartCalculationError({
            stage: "validation",
            message: "Moment and geographic coordinates must be valid",
            cause: input,
          });
        }

        const normalizedDivisions = yield* normalizeDivisions(divisions);

        const placementEvidence = yield* Effect.gen(function* () {
          const julianDay = yield* ephemeris.dateToJulianDay(input.moment.date);
          const houses = yield* ephemeris.calculateHouses(
            julianDay,
            input.latitude,
            input.longitude,
            Swisseph.HouseSystem.WholeSign,
            astroParams.ayanamsa,
          );
          const planetEntries = yield* Effect.all(
            BODY_ENTRIES.map(([name, body]) =>
              ephemeris
                .calculatePosition(julianDay, body, astroParams.ayanamsa)
                .pipe(Effect.map((position) => [name, position] as const)),
            ),
            { concurrency: "unbounded" },
          );
          return { houses, planetEntries } as const;
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChartCalculationError({
                stage: "placements",
                message: "Could not calculate Placements",
                cause,
              }),
          ),
        );

        const placements = yield* Effect.gen(function* () {
          const sourcePlanets = yield* Effect.all(
            placementEvidence.planetEntries.map(([name, position]) =>
              normalizeLongitude(position.longitude).pipe(
                Effect.map(
                  (longitude) =>
                    new SourcePlanet({
                      name,
                      longitude,
                      is_retrograde: position.longitudeSpeed < 0,
                      nakshatra: nakshatraOf(longitude),
                    }),
                ),
              ),
            ),
            { concurrency: "unbounded" },
          );
          const rahu = sourcePlanets.find((planet) => planet.name === "Rahu");
          if (rahu === undefined) {
            return yield* new MissingPlacementError({ placement: "Rahu" });
          }

          const ketuLongitude = yield* normalizeLongitude(rahu.longitude + 180);
          const planets = [
            ...sourcePlanets,
            new SourcePlanet({
              name: "Ketu",
              longitude: ketuLongitude,
              is_retrograde: rahu.is_retrograde,
              nakshatra: nakshatraOf(ketuLongitude),
            }),
          ];
          const ascendant = yield* normalizeLongitude(placementEvidence.houses.ascendant);

          return new Placements({
            lagna: new SourceLagna({
              name: "Lagna",
              longitude: ascendant,
              nakshatra: nakshatraOf(ascendant),
            }),
            planets,
          });
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChartCalculationError({
                stage: "placements",
                message: "Could not calculate Placements",
                cause,
              }),
          ),
        );

        const [firstDivision, ...remainingDivisions] = normalizedDivisions;
        const charts = yield* Effect.gen(function* () {
          const firstChart = yield* chartFromPlacements(placements, firstDivision);
          const remainingCharts = yield* Effect.all(
            remainingDivisions.map((division) => chartFromPlacements(placements, division)),
            { concurrency: "unbounded" },
          );

          return [firstChart, ...remainingCharts] as [Chart, ...Chart[]];
        }).pipe(
          Effect.mapError(
            (cause) =>
              new ChartCalculationError({
                stage: "mapping",
                message: "Could not map one or more requested Divisions",
                cause,
              }),
          ),
        );

        return new ChartCalculation({
          placements,
          charts,
        });
      });

      return ChartService.of({ generate });
    }),
  );
}
