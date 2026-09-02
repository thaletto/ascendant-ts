import { describe, expect, it } from "@effect/vitest";

import { kendraContinuousPatternDefinitions } from "../src/yoga/definitions/kendra-continuous-patterns.js";
import { YogaCondition, YogaStrategy } from "../src/yoga/internal.js";

describe("Kendra-start continuous-house Yogas", () => {
  it("defines the four source-faithful IDs with distinct Chapa identity", () => {
    expect(kendraContinuousPatternDefinitions.map(({ yoga }) => yoga.id)).toEqual([
      "nav",
      "kuta",
      "chhatra",
      "chapa_continuous",
    ]);
  });

  it("uses seven classical planets and node-excluding occupancy for each Kendra start", () => {
    const starts = [1, 4, 7, 10] as const;
    for (const [definition, start] of kendraContinuousPatternDefinitions.map(
      (definition, index) => [definition, starts[index] ?? 1] as const,
    )) {
      expect(YogaStrategy.$is("Condition")(definition.strategy)).toBe(true);
      if (YogaStrategy.$is("Condition")(definition.strategy)) {
        expect(YogaCondition.$is("AllCondition")(definition.strategy.condition)).toBe(true);
        if (YogaCondition.$is("AllCondition")(definition.strategy.condition)) {
          const [positions, occupancy] = definition.strategy.condition.children;
          expect(positions).toMatchObject({
            _tag: "BodyPositionsCondition",
            bodies: ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"],
            expectedRelativeHouses: Array.from(
              { length: 7 },
              (_, offset) => ((start - 1 + offset) % 12) + 1,
            ),
          });
          expect(occupancy).toMatchObject({
            _tag: "HouseOccupancyCondition",
            quantifier: "EveryHouse",
            excludedBodies: ["Rahu", "Ketu"],
          });
        }
      }
    }
  });
});
