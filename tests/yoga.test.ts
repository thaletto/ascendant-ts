import { describe, expect, it } from "@effect/vitest";
import { Array, Effect, Equal, Record, Schema } from "effect";

import * as Chart from "../src/chart/index.js";
import * as Yoga from "../src/yoga/index.js";
import { fixtures } from "./support/fixtures.js";

function evaluate(calculation: Chart.ChartCalculation, ids?: readonly string[]) {
  return ids === undefined
    ? Yoga.evaluateAll(calculation)
    : Yoga.evaluateSelected(
        calculation,
        ids.map((id) => Yoga.YogaId.make(id)),
      );
}

describe("Yoga", () => {
  it("publishes the Moon-relative rule set without strength or prose in results", () => {
    expect(
      Equal.equals(
        Yoga.catalog.map(({ id }) => id),
        [
          "gajakesari",
          "sunapha",
          "anapha",
          "dhurdhua",
          "kemadruma",
          "chandra_mangala",
          "adhi",
          "sakata",
          "amala",
          "kusuma",
          "thrilochana",
          "bhaskara",
          "marud",
          "budha",
          "chatussagara",
          "vasumathi",
          "rajalakshana",
        ],
      ),
    ).toBe(true);
    expect(
      Yoga.catalog.every(
        (descriptor) =>
          !Array.some(Record.keys(descriptor), (key) => Equal.equals(key, "strength")),
      ),
    ).toBe(true);
  });

  it.effect(
    "evaluates every definition in rule-set order and preserves structured provenance",
    () =>
      Effect.gen(function* () {
        const result = yield* evaluate(fixtures.calculationFromHouses(), undefined);

        expect(
          Equal.equals(result.provenance, {
            school: "Parashari",
            method: "ascendant-yoga",
            version: "v1",
          }),
        ).toBe(true);
        expect(
          Equal.equals(
            result.results.map(({ yoga }) => yoga.id),
            Yoga.catalog.map(({ id }) => id),
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
      const evaluation = Array.getUnsafe(result.results, 0);

      expect(evaluation.present).toBe(true);
      expect(
        Equal.equals(evaluation.evidence, {
          _tag: "BodyPositionsEvidence",
          division: 1,
          referenceBody: "Moon",
          bodies: ["Jupiter"],
          observed: [{ body: "Jupiter", relativeHouse: 4 }],
          expectedRelativeHouses: [1, 4, 7, 10],
          quantifier: "All",
          matched: true,
        }),
      ).toBe(true);
    }),
  );

  it.effect("represents composed definitions as All, Any, and Not evidence", () =>
    Effect.gen(function* () {
      const result = yield* evaluate(
        fixtures.calculationFromHouses({ Moon: 1, Mars: 2, Saturn: 12 }),
        ["dhurdhua", "kemadruma"],
      );
      const dhurdhua = Array.getUnsafe(result.results, 0);
      const kemadruma = Array.getUnsafe(result.results, 1);

      expect(dhurdhua.evidence._tag).toBe("AllEvidence");
      expect(dhurdhua.evidence.matched).toBe(true);
      expect(kemadruma.evidence._tag).toBe("NotEvidence");
      expect(kemadruma.evidence.matched).toBe(false);
      if (kemadruma.evidence._tag === "NotEvidence") {
        expect(kemadruma.evidence.child._tag).toBe("AnyEvidence");
        expect(kemadruma.evidence.child.matched).toBe(true);
      }
      expect(Yoga.formatEvidence(kemadruma.evidence)).toContain("Negated condition does not match");
    }),
  );

  it.effect("uses Astrotalk's stated Moon-relative occupancy exclusions", () =>
    Effect.gen(function* () {
      const result = yield* evaluate(
        fixtures.calculationFromHouses({
          Moon: 1,
          Sun: 2,
          Mars: 5,
          Mercury: 5,
          Jupiter: 5,
          Venus: 5,
          Saturn: 5,
          Rahu: 12,
          Ketu: 5,
        }),
        ["sunapha", "anapha", "dhurdhua", "kemadruma"],
      );

      expect(
        Equal.equals(
          result.results.map(({ present }) => present),
          [false, true, true, false],
        ),
      ).toBe(true);
    }),
  );

  it.effect("requires all three natural benefics for Adhi Yoga", () =>
    Effect.gen(function* () {
      const present = yield* evaluate(
        fixtures.calculationFromHouses({
          Moon: 1,
          Mercury: 6,
          Jupiter: 7,
          Venus: 8,
        }),
        ["adhi"],
      );
      const absent = yield* evaluate(
        fixtures.calculationFromHouses({
          Moon: 1,
          Mercury: 6,
          Jupiter: 7,
          Venus: 9,
        }),
        ["adhi"],
      );

      expect(present.results[0]?.present).toBe(true);
      expect(absent.results[0]?.present).toBe(false);
    }),
  );

  it.effect("evaluates the added Moon-relative source rules", () =>
    Effect.gen(function* () {
      const cases = [
        ["sakata", { Jupiter: 1, Moon: 6 }],
        ["amala", { Moon: 1, Jupiter: 10 }],
        ["kusuma", { Jupiter: 1, Moon: 7, Sun: 2 }],
        ["thrilochana", { Moon: 1, Sun: 5, Mars: 9 }],
        ["bhaskara", { Sun: 1, Mercury: 2, Moon: 12, Jupiter: 4 }],
        ["marud", { Venus: 1, Jupiter: 5, Moon: 9, Sun: 12 }],
        ["budha", { Jupiter: 1, Moon: 4, Rahu: 5, Sun: 7, Mars: 7 }],
      ] as const;

      for (const [id, houses] of cases) {
        const result = yield* evaluate(fixtures.calculationFromHouses(houses), [id]);
        expect(result.results[0]?.present).toBe(true);
      }
    }),
  );

  it.effect("fails atomically when required evidence is missing or malformed", () =>
    Effect.gen(function* () {
      const source = fixtures.calculationFromHouses();
      const d1 = Array.getUnsafe(source.charts, 0);
      const malformed = Chart.ChartCalculation.make({
        placements: source.placements,
        charts: [d1, d1],
        bhava: source.bhava,
        astroParams: source.astroParams,
      });
      const exit = yield* Effect.exit(evaluate(malformed, ["gajakesari"]));

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") expect(String(exit.cause)).toContain("InvalidYogaEvidenceError");
    }),
  );
});
