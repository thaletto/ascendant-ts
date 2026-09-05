import { Effect } from "effect";

import { AstroParams } from "../astro-params/service.js";
import type { CelestialBody } from "../ephemeris/model.js";
import { Ephemeris } from "../ephemeris/service.js";
import { bhavaFromHouseData } from "./bhava/index.js";
import { project } from "./charts.js";
import { ChartCalculationError, LocatedMomentValidationError } from "./error.js";
import {
  ChartCalculation,
  type ChartParams,
  Division,
  LocatedMoment,
  type Planets,
} from "./model.js";
import { placementsFromEvidence, type PlacementEvidence } from "./placements.js";

const PLANET_BODY_MAP = [
  ["Sun", "Sun"],
  ["Moon", "Moon"],
  ["Mars", "Mars"],
  ["Mercury", "Mercury"],
  ["Venus", "Venus"],
  ["Jupiter", "Jupiter"],
  ["Saturn", "Saturn"],
  ["Rahu", "TrueNode"],
] as const satisfies readonly (readonly [Planets, CelestialBody])[];

const validateInput = Effect.fn("astro-ascendant/chart/validateInput")(function* (
  input: LocatedMoment,
) {
  const valid =
    Number.isFinite(input.latitude) &&
    input.latitude >= -90 &&
    input.latitude <= 90 &&
    Number.isFinite(input.longitude) &&
    input.longitude >= -180 &&
    input.longitude <= 180 &&
    Number.isFinite(input.moment.date.epochMilliseconds);

  if (!valid) {
    return yield* LocatedMomentValidationError.make({
      message: "Moment and geographic coordinates must be valid",
      cause: input,
    });
  }
});

/**
 * Obtains the single ephemeris evidence set shared by all derived charts: house
 * cusps/angles and sidereal positions for the seven classical planets and Rahu.
 * Ketu is deliberately derived later as Rahu's exact opposition.
 */
const calculatePlacementEvidence = Effect.fn("astro-ascendant/chart/calculatePlacementEvidence")(
  function* (input: LocatedMoment) {
    const astroParams = yield* AstroParams;
    const ephemeris = yield* Ephemeris;
    const julianDay = yield* ephemeris.dateToJulianDay(input.moment.date);
    const houses = yield* ephemeris.calculateHouses(
      julianDay,
      input.latitude,
      input.longitude,
      astroParams.houseSystem,
      astroParams.ayanamsa,
    );
    const planetEntries = yield* Effect.all(
      PLANET_BODY_MAP.map(([name, body]) =>
        ephemeris
          .calculatePosition(julianDay, body, astroParams.ayanamsa)
          .pipe(Effect.map((position) => [name, position] as const)),
      ),
      { concurrency: "unbounded" },
    );

    return { houses, planetEntries } satisfies PlacementEvidence;
  },
  Effect.mapError((cause) =>
    ChartCalculationError.make({
      stage: "placements",
      message: "Could not calculate Placements",
      cause,
    }),
  ),
);

/**
 * Produces one internally consistent chart calculation for a located moment.
 * It validates coordinates, calculates sidereal placement evidence once, derives
 * D1 and requested divisions from those placements, and builds the configured
 * cusp-based Bhava chart from the same ephemeris house data.
 */
export const generate = Effect.fn("astro-ascendant/chart/generate")(function* (
  input: ChartParams,
  divisions: readonly Division[] = [],
) {
  const astroParams = yield* AstroParams;
  yield* validateInput(input);
  const evidence = yield* calculatePlacementEvidence(input);
  const placements = yield* placementsFromEvidence(evidence);
  const charts = yield* project(placements, divisions, input.sex);
  const bhava = yield* bhavaFromHouseData(evidence.houses, charts[0]);

  return ChartCalculation.make({
    placements,
    charts,
    bhava,
    astroParams,
  });
});
