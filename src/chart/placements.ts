import { Effect } from "effect";

import { Placements, SourceLagna, SourcePlanet } from "../internal/model.js";
import { normalizeLongitude } from "./divisional-mapping/index.js";
import { ChartCalculationError, MissingPlacementError } from "./error.js";
import { nakshatraOf } from "./helper.js";
import type { PlacementEvidence } from "./model.js";

export const placementsFromEvidence = Effect.fn("Chart.placementsFromEvidence")(
  function* (evidence: PlacementEvidence) {
    const sourcePlanets = yield* Effect.all(
      evidence.planetEntries.map(([name, position]) =>
        normalizeLongitude(position.longitude).pipe(
          Effect.map((longitude) =>
            SourcePlanet.make({
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
      return yield* MissingPlacementError.make({ placement: "Rahu" });
    }

    const ketuLongitude = yield* normalizeLongitude(rahu.longitude + 180);
    const ascendant = yield* normalizeLongitude(evidence.houses.ascendant);
    const planets = [
      ...sourcePlanets,
      SourcePlanet.make({
        name: "Ketu",
        longitude: ketuLongitude,
        is_retrograde: rahu.is_retrograde,
        nakshatra: nakshatraOf(ketuLongitude),
      }),
    ];

    return Placements.make({
      lagna: SourceLagna.make({
        name: "Lagna",
        longitude: ascendant,
        nakshatra: nakshatraOf(ascendant),
      }),
      planets,
    });
  },
  Effect.mapError((cause) =>
    ChartCalculationError.make({
      stage: "placements",
      message: "Could not calculate Placements",
      cause,
    }),
  ),
);
