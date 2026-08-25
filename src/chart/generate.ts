import { Effect } from "effect";

import { AstroParams } from "../astro-params/service.js";
import { Ephemeris } from "../ephemeris/service.js";
import { PLANET_BODY_MAP } from "../internal/constant.js";
import { ChartCalculation, Division, LocatedMoment } from "../internal/model.js";
import { bhavaFromHouseData } from "./bhava/index.js";
import { chartsFromPlacements } from "./charts.js";
import { ChartCalculationError, LocatedMomentValidationError } from "./error.js";
import type { PlacementEvidence } from "./model.js";
import { placementsFromEvidence } from "./placements.js";

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

export const generate = Effect.fn("astro-ascendant/chart/generate")(function* (
  input: LocatedMoment,
  divisions: readonly [Division, ...Division[]],
) {
  const astroParams = yield* AstroParams;
  yield* validateInput(input);
  const evidence = yield* calculatePlacementEvidence(input);
  const placements = yield* placementsFromEvidence(evidence);
  const charts = yield* chartsFromPlacements(placements, divisions);
  const bhava = yield* bhavaFromHouseData(evidence.houses, charts[0]);

  return ChartCalculation.make({
    placements,
    charts,
    bhava,
    astroParams,
  });
});
