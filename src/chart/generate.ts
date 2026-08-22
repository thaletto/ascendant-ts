import { Effect } from "effect";
import type { Service as AstroParams } from "../astro-params/service.js";
import { type CelestialBody } from "../ephemeris/model.js";
import type { Service as Ephemeris } from "../ephemeris/service.js";
import { ChartCalculationError, LocatedMomentValidationError } from "./error.js";
import { chartsFromPlacements } from "./charts.js";
import { ChartCalculation, Division, LocatedMoment, Planets } from "./model.js";
import { placementsFromEvidence, type PlacementEvidence } from "./placements.js";

const BODY_ENTRIES = [
  ["Sun", "Sun"],
  ["Moon", "Moon"],
  ["Mars", "Mars"],
  ["Mercury", "Mercury"],
  ["Venus", "Venus"],
  ["Jupiter", "Jupiter"],
  ["Saturn", "Saturn"],
  ["Rahu", "TrueNode"],
] as const satisfies readonly (readonly [typeof Planets.Type, CelestialBody])[];

const SUPPORTED_DIVISIONS = new Set<number>(Division.literals);

const validateInput = Effect.fn("Chart.validateInput")(function* (input: LocatedMoment) {
  const valid =
    Number.isFinite(input.latitude) &&
    input.latitude >= -90 &&
    input.latitude <= 90 &&
    Number.isFinite(input.longitude) &&
    input.longitude >= -180 &&
    input.longitude <= 180 &&
    Number.isFinite(input.moment.date.getTime());

  if (!valid) {
    return yield* new LocatedMomentValidationError({
      message: "Moment and geographic coordinates must be valid",
      cause: input,
    });
  }
});

const normalizeDivisions = Effect.fn("Chart.normalizeDivisions")(function* (
  requested: readonly number[],
) {
  const unsupported = requested.find((division) => !SUPPORTED_DIVISIONS.has(division));
  if (unsupported !== undefined) {
    return yield* new ChartCalculationError({
      stage: "validation",
      message: `Division D${unsupported} is not supported`,
      cause: unsupported,
    });
  }

  return [...new Set([1, ...requested])].sort((left, right) => left - right) as [
    typeof Division.Type,
    ...(typeof Division.Type)[],
  ];
});

export function makeGenerate(ephemeris: Ephemeris, astroParams: AstroParams) {
  const calculatePlacementEvidence = Effect.fn("Chart.calculatePlacementEvidence")(
    function* (input: LocatedMoment) {
      const julianDay = yield* ephemeris.dateToJulianDay(input.moment.date);
      const houses = yield* ephemeris.calculateHouses(
        julianDay,
        input.latitude,
        input.longitude,
        "WholeSign",
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

      return { houses, planetEntries } satisfies PlacementEvidence;
    },
    Effect.mapError(
      (cause) =>
        new ChartCalculationError({
          stage: "placements",
          message: "Could not calculate Placements",
          cause,
        }),
    ),
  );

  return Effect.fn("Chart.generate")(function* (
    input: LocatedMoment,
    divisions: readonly number[] = [],
  ) {
    yield* validateInput(input);
    const normalizedDivisions = yield* normalizeDivisions(divisions);
    const evidence = yield* calculatePlacementEvidence(input);
    const placements = yield* placementsFromEvidence(evidence);
    const charts = yield* chartsFromPlacements(placements, normalizedDivisions);

    return new ChartCalculation({
      placements,
      charts,
    });
  });
}
