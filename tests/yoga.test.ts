import { describe, expect, it } from "@effect/vitest";
import { Array, Effect, Equal, Record, Schema } from "effect";

import * as Model from "../src/internal/model.js";
import { catalog } from "../src/yoga/catalog.js";
import * as Yoga from "../src/yoga/index.js";
import { fixtures } from "./support/fixtures.js";

function evaluate(calculation: Model.ChartCalculation, ids?: readonly string[]) {
  return Effect.gen(function* () {
    const service = yield* Yoga.Yoga;
    return ids === undefined
      ? yield* service.evaluateAll(calculation)
      : yield* service.evaluateSelected(
          calculation,
          ids.map((id) => Yoga.YogaId.make(id)),
        );
  });
}

describe("Yoga", () => {
  it("publishes the ten-rule catalog without strength or prose in results", () => {
    expect(
      Equal.equals(
        catalog.map(({ id }) => id),
        [
          "gajakesari",
          "sunapha",
          "anapha",
          "dhurdhua",
          "kemadruma",
          "chandra_mangala",
          "adhi",
          "chatussagara",
          "vasumathi",
          "rajalakshana",
        ],
      ),
    ).toBe(true);
    expect(
      catalog.every(
        (descriptor) =>
          !Array.some(Record.keys(descriptor), (key) => Equal.equals(key, "strength")),
      ),
    ).toBe(true);
  });

  it.layer(Yoga.YogaLayer)((it) => {
    it.effect("evaluates every rule in catalog order and preserves structured provenance", () =>
      Effect.gen(function* () {
        const result = yield* evaluate(fixtures.calculationFromHouses(), undefined);

        expect(Equal.equals(result.provenance, { method: "ascendant-yoga", version: "v1" })).toBe(
          true,
        );
        expect(
          Equal.equals(
            result.results.map(({ yoga }) => yoga.id),
            catalog.map(({ id }) => id),
          ),
        ).toBe(true);
        expect(result.results.every(({ evidence }) => typeof evidence.matched === "boolean")).toBe(
          true,
        );
        expect(
          result.results.every(
            ({ yoga }) => !Array.some(Record.keys(yoga), (key) => Equal.equals(key, "strength")),
          ),
        ).toBe(true);
      }),
    );

    it.effect("evaluates a caller-selected subset in caller order", () =>
      Effect.gen(function* () {
        const result = yield* evaluate(fixtures.calculationFromHouses({ Moon: 1, Jupiter: 4 }), [
          "rajalakshana",
          "gajakesari",
        ]);

        expect(
          Equal.equals(
            result.results.map(({ yoga }) => yoga.id),
            ["rajalakshana", "gajakesari"],
          ),
        ).toBe(true);
        expect(result.results[1]?.present).toBe(true);
      }),
    );

    it.effect("reports unknown, duplicate, and empty selections as typed failures", () =>
      Effect.gen(function* () {
        const unknown = yield* Effect.exit(
          evaluate(fixtures.calculationFromHouses(), ["not_a_yoga"]),
        );
        const duplicate = yield* Effect.exit(
          evaluate(fixtures.calculationFromHouses(), ["sunapha", "sunapha"]),
        );
        const empty = yield* Effect.exit(evaluate(fixtures.calculationFromHouses(), []));

        expect(String(unknown)).toContain("UnknownYogaError");
        expect(String(duplicate)).toContain("DuplicateYogaSelectionError");
        expect(String(empty)).toContain("EmptyYogaSelectionError");
        expect(Schema.is(Yoga.YogaSelection)(["sunapha"])).toBe(true);
      }),
    );

    it.effect("explains Gajakesari with body-position evidence, including wraparound", () =>
      Effect.gen(function* () {
        const result = yield* evaluate(fixtures.calculationFromHouses({ Moon: 12, Jupiter: 3 }), [
          "gajakesari",
        ]);

        expect(result.results[0]).toMatchObject({
          present: true,
          evidence: {
            _tag: "BodyPositionsEvidence",
            referenceBody: "Moon",
            observed: [{ body: "Jupiter", relativeHouse: 4 }],
            expectedRelativeHouses: [1, 4, 7, 10],
            matched: true,
          },
        });
      }),
    );

    it.effect("represents composed rules as All, Any, and Not evidence", () =>
      Effect.gen(function* () {
        const result = yield* evaluate(
          fixtures.calculationFromHouses({ Moon: 1, Mars: 2, Saturn: 12 }),
          ["dhurdhua", "kemadruma"],
        );

        expect(result.results[0]?.evidence).toMatchObject({ _tag: "AllEvidence", matched: true });
        expect(result.results[1]?.evidence).toMatchObject({
          _tag: "NotEvidence",
          matched: false,
          child: { _tag: "AnyEvidence", matched: true },
        });
        expect(Yoga.formatEvidence(result.results[1]!.evidence)).toContain(
          "Negated condition does not match",
        );
      }),
    );

    it.effect(
      "fails atomically when a required division is missing or D1 evidence is malformed",
      () =>
        Effect.gen(function* () {
          const source = fixtures.calculationFromHouses();
          const d1 = source.charts[0]!;
          const malformed = Model.ChartCalculation.make({
            placements: source.placements,
            charts: [d1, d1],
            bhava: source.bhava,
            astroParams: source.astroParams,
          });
          const exit = yield* Effect.exit(evaluate(malformed, ["gajakesari"]));

          expect(exit._tag).toBe("Failure");
          if (exit._tag === "Failure")
            expect(String(exit.cause)).toContain("InvalidYogaEvidenceError");
        }),
    );
  });
});
