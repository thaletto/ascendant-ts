import { describe, expect, it } from "@effect/vitest";
import { Effect, Equal } from "effect";

import { signModalityDefinitions } from "../src/yoga/definitions/sign-modality.js";
import { evaluateDefinition, makeEvaluationIndex } from "../src/yoga/evaluate.js";
import { formatEvidence } from "../src/yoga/format.js";
import { fixtures } from "./support/fixtures.js";

describe("sign-modality Yogas", () => {
  it.effect("matches movable, fixed, and dual signs with complete evidence", () =>
    Effect.gen(function* () {
      const cases = [
        [
          "rajju",
          {
            Sun: 1,
            Moon: 4,
            Mars: 7,
            Mercury: 10,
            Jupiter: 1,
            Venus: 4,
            Saturn: 7,
            Rahu: 10,
            Ketu: 1,
          },
        ],
        [
          "musala",
          {
            Sun: 2,
            Moon: 5,
            Mars: 8,
            Mercury: 11,
            Jupiter: 2,
            Venus: 5,
            Saturn: 8,
            Rahu: 11,
            Ketu: 2,
          },
        ],
        [
          "nala",
          {
            Sun: 3,
            Moon: 6,
            Mars: 9,
            Mercury: 12,
            Jupiter: 3,
            Venus: 6,
            Saturn: 9,
            Rahu: 12,
            Ketu: 3,
          },
        ],
      ] as const;

      for (const [id, houses] of cases) {
        const definition = signModalityDefinitions.find(({ yoga }) => yoga.id === id);
        if (definition === undefined) throw new Error(`Missing definition ${id}`);
        const result = yield* evaluateDefinition(
          definition,
          makeEvaluationIndex(fixtures.calculationFromHouses(houses)),
        );
        expect(result.present).toBe(true);
        expect(result.evidence._tag).toBe("SignModalityEvidence");
        if (result.evidence._tag === "SignModalityEvidence") {
          const expectedModality = result.evidence.expectedModality;
          expect(result.evidence.observed).toHaveLength(9);
          expect(
            result.evidence.observed.every(({ modality }) => modality === expectedModality),
          ).toBe(true);
          expect(formatEvidence(result.evidence)).toContain(expectedModality.toLocaleLowerCase());
        }
      }
    }),
  );

  it("does not treat a common sign as fixed or movable", () => {
    const definition = signModalityDefinitions[0];
    const result = Effect.runSync(
      evaluateDefinition(
        definition,
        makeEvaluationIndex(fixtures.calculationFromHouses({ Sun: 3 })),
      ),
    );
    expect(Equal.equals(result.present, false)).toBe(true);
  });
});
