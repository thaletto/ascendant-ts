import { Context, Effect, Layer } from "effect";
import * as Swisseph from "@swisseph/node";
import {
  Birth,
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

const isValidInput = (input: LocatedMoment | Birth): boolean =>
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

const chartFromPlacements = (placements: Placements, division: typeof Division.Type): Chart => {
  const mappedLagna = getDivisionalTarget(placements.lagna.longitude, division);
  const lagnaSign = Rashis.literals[mappedLagna.signIndex]!;
  const lagna = new Lagna({
    name: "Lagna",
    longitude: mappedLagna.longitude,
    degree: mappedLagna.degree,
    sign: sign(lagnaSign),
  });

  const mappedPlanets = placements.planets.map((source) => {
    const mapped = getDivisionalTarget(source.longitude, division);
    const mappedSign = Rashis.literals[mapped.signIndex]!;
    return new Planet({
      name: source.name,
      longitude: mapped.longitude,
      degree: mapped.degree,
      is_retrograde: source.is_retrograde,
      in_sign: [...inSignStatus(source.name, mappedSign, mapped.degree)],
      sign: sign(mappedSign),
    });
  });

  const houses = {} as Record<typeof Houses.Type, House>;
  for (let index = 0; index < 12; index++) {
    const house = (index + 1) as typeof Houses.Type;
    const houseSign = Rashis.literals[(mappedLagna.signIndex + index) % 12]!;
    houses[house] = new House({
      sign: houseSign,
      planets: mappedPlanets.filter((planet) => planet.sign.name === houseSign),
      lagna: house === 1 ? lagna : null,
    });
  }

  return new Chart({ division, houses });
};

export class ChartService extends Context.Service<
  ChartService,
  {
    readonly generate: (
      input: LocatedMoment | Birth,
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
        input: LocatedMoment | Birth,
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

        const placements = yield* Effect.try({
          try: () => {
            const sourcePlanets = placementEvidence.planetEntries.map(
              ([name, position]) =>
                new SourcePlanet({
                  name,
                  longitude: normalizeLongitude(position.longitude),
                  is_retrograde: position.longitudeSpeed < 0,
                  nakshatra: nakshatraOf(position.longitude),
                }),
            );
            const rahu = sourcePlanets.find((planet) => planet.name === "Rahu");
            if (rahu === undefined) {
              throw new Error("Rahu is missing from Placements");
            }
            const ketuLongitude = normalizeLongitude(rahu.longitude + 180);
            sourcePlanets.push(
              new SourcePlanet({
                name: "Ketu",
                longitude: ketuLongitude,
                is_retrograde: rahu.is_retrograde,
                nakshatra: nakshatraOf(ketuLongitude),
              }),
            );

            const ascendant = normalizeLongitude(placementEvidence.houses.ascendant);
            return new Placements({
              lagna: new SourceLagna({
                name: "Lagna",
                longitude: ascendant,
                nakshatra: nakshatraOf(ascendant),
              }),
              planets: sourcePlanets,
            });
          },
          catch: (cause) =>
            new ChartCalculationError({
              stage: "placements",
              message: "Could not calculate Placements",
              cause,
            }),
        });

        const charts = yield* Effect.try({
          try: () =>
            normalizedDivisions.map((division) => chartFromPlacements(placements, division)) as [
              Chart,
              ...Chart[],
            ],
          catch: (cause) =>
            new ChartCalculationError({
              stage: "mapping",
              message: "Could not map one or more requested Divisions",
              cause,
            }),
        });

        return new ChartCalculation({
          placements,
          charts,
        });
      });

      return ChartService.of({ generate });
    }),
  );
}
