import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { golaCardinalityDefinitions } from "../src/yoga/definitions/gola-cardinality.js";
import { evaluateDefinition, makeEvaluationIndex } from "../src/yoga/evaluate.js";
import { fixtures } from "./support/fixtures.js";

describe("Gola Yoga cardinality formation", () => {
  it.effect("matches when all nine modeled planets occupy one sign", () =>
    Effect.gen(function* () {
      const definition = golaCardinalityDefinitions[0];
      const result = yield* evaluateDefinition(
        definition,
        makeEvaluationIndex(
          fixtures.calculationFromHouses({
            Sun: 1,
            Moon: 1,
            Mars: 1,
            Mercury: 1,
            Jupiter: 1,
            Venus: 1,
            Saturn: 1,
            Rahu: 1,
            Ketu: 1,
          }),
        ),
      );

      expect(result.present).toBe(true);
      expect(result.evidence._tag).toBe("OccupiedSignCountEvidence");
      if (result.evidence._tag === "OccupiedSignCountEvidence") {
        expect(result.evidence.expectedSignCount).toBe(1);
        expect(result.evidence.observedSignCount).toBe(1);
        expect(result.evidence.bodies).toHaveLength(9);
      }
    }),
  );

  it("uses the single-sign occupied-count condition", () => {
    const strategy = golaCardinalityDefinitions[0].strategy;
    expect(strategy._tag).toBe("Condition");
    if (strategy._tag === "Condition") {
      expect(strategy.condition._tag).toBe("OccupiedSignCountCondition");
      if (strategy.condition._tag === "OccupiedSignCountCondition") {
        expect(strategy.condition.expectedSignCount).toBe(1);
        expect(strategy.condition.division).toBe(1);
      }
    }
  });
});
