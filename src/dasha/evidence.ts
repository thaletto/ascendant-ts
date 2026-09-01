import { Effect } from "effect";

import type { Placements } from "../chart/model.js";
import { DashaEvidenceError } from "./error.js";

export const validateUniquePlanetPlacements = Effect.fn("Dasha.validateUniquePlanetPlacements")(
  function* (placements: Placements, context: string) {
    for (const planet of new Set(placements.planets.map((placement) => placement.name))) {
      const actual = placements.planets.filter((placement) => placement.name === planet).length;
      if (actual !== 1) {
        return yield* DashaEvidenceError.make({
          placement: planet,
          expected: 1,
          actual,
          context,
        });
      }
    }
  },
);
