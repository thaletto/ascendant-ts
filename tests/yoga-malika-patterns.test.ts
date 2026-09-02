import { describe, expect, it } from "@effect/vitest";

import type { Houses } from "../src/chart/model.js";
import { malikaPatternDefinitions } from "../src/yoga/definitions/malika-patterns.js";
import { YogaCondition } from "../src/yoga/internal.js";

const ids = [
  "lagna_malika",
  "dhana_malika",
  "vikrama_malika",
  "sukha_malika",
  "putra_malika",
  "satru_malika",
  "kalatra_malika",
  "randhra_malika",
  "bhagya_malika",
  "karma_malika",
  "labha_malika",
  "vraya_malika",
] as const;

describe("Malika pattern definitions", () => {
  it("defines the twelve source-faithful Malika yogas", () => {
    expect(malikaPatternDefinitions.map(({ yoga }) => yoga.id)).toEqual(ids);
  });

  it("requires classical containment and genuine occupancy, including wraparound", () => {
    for (const [index, definition] of malikaPatternDefinitions.entries()) {
      const start = index + 1;
      const expected = Array.from(
        { length: 7 },
        (_, offset) => (((start - 1 + offset) % 12) + 1) as Houses,
      );
      expect(definition.requiredDivisions).toEqual([1]);
      expect(definition.strategy._tag).toBe("Condition");
      if (definition.strategy._tag !== "Condition") continue;
      expect(definition.strategy.condition._tag).toBe("AllCondition");
      if (definition.strategy.condition._tag !== "AllCondition") continue;
      const [positions, occupancy] = definition.strategy.condition.children;
      expect(positions).toEqual(
        YogaCondition.BodyPositionsCondition({
          division: 1,
          referenceBody: "Lagna",
          bodies: ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"],
          expectedRelativeHouses: expected,
          quantifier: "All",
        }),
      );
      expect(occupancy).toEqual(
        YogaCondition.HouseOccupancyCondition({
          division: 1,
          referenceBody: "Lagna",
          expectedRelativeHouses: expected,
          excludedBodies: ["Rahu", "Ketu"],
          quantifier: "EveryHouse",
        }),
      );
    }
  });
});
