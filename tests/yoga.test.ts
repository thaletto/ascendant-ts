import { describe, expect, it } from "@effect/vitest";
import { Array, Effect, Equal, Schema } from "effect";

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
  it("publishes a unique Yoga catalog without strength or prose in descriptors", () => {
    const ids = Yoga.catalog.map(({ id }) => id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Yoga.catalog.every((descriptor) => !("strength" in descriptor))).toBe(true);
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
            version: "v2",
          }),
        ).toBe(true);
        expect(
          Equal.equals(
            result.results.map(({ yoga }) => yoga.id),
            Yoga.catalog.map(({ id }) => id),
          ),
        ).toBe(true);
        expect(
          result.results.every(
            ({ evidence }) => typeof evidence.matched === "boolean" || evidence.matched === null,
          ),
        ).toBe(true);
        expect(result.results.every(({ yoga }) => !("strength" in yoga))).toBe(true);
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

  it.effect("evaluates the next relative-placement source rules", () =>
    Effect.gen(function* () {
      const cases = [
        ["vesi", { Sun: 1, Mars: 2 }],
        ["vasi", { Sun: 1, Mars: 12 }],
        ["obhayachari", { Sun: 1, Mars: 2, Jupiter: 12 }],
        ["budha_aditya", { Sun: 1, Mercury: 1 }],
        ["srik", { Mercury: 1, Jupiter: 4, Venus: 10 }],
        [
          "chandra",
          {
            Sun: 1,
            Moon: 3,
            Mars: 5,
            Mercury: 7,
            Jupiter: 9,
            Venus: 11,
            Saturn: 1,
            Rahu: 3,
            Ketu: 5,
          },
        ],
      ] as const;

      for (const [id, houses] of cases) {
        const result = yield* evaluate(fixtures.calculationFromHouses(houses), [id]);
        expect(result.results[0]?.present).toBe(true);
      }
    }),
  );

  it.effect("preserves exclusions and all-body requirements in the next rule set", () =>
    Effect.gen(function* () {
      const moonOnly = yield* evaluate(
        fixtures.calculationFromHouses({ Sun: 1, Moon: 2, Rahu: 1 }),
        ["vesi"],
      );
      const incompleteSrik = yield* evaluate(
        fixtures.calculationFromHouses({ Mercury: 1, Jupiter: 4 }),
        ["srik"],
      );
      const incompleteChandra = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 1,
          Moon: 3,
          Mars: 5,
          Mercury: 7,
          Jupiter: 9,
          Venus: 11,
          Saturn: 1,
          Rahu: 3,
          Ketu: 2,
        }),
        ["chandra"],
      );

      expect(moonOnly.results[0]?.present).toBe(false);
      expect(incompleteSrik.results[0]?.present).toBe(false);
      expect(incompleteChandra.results[0]?.present).toBe(false);
    }),
  );

  it.effect("evaluates the Pancha Mahapurusha Yogas from kendra and dignity evidence", () =>
    Effect.gen(function* () {
      const cases = [
        ["hamsa", "Jupiter"],
        ["malavya", "Venus"],
        ["sasa", "Saturn"],
        ["ruchaka", "Mars"],
        ["bhadra", "Mercury"],
      ] as const;

      for (const [id, planet] of cases) {
        const result = yield* evaluate(
          fixtures.calculationFromHouses({ [planet]: 1 }, [1], {
            dignities: { [planet]: ["OWN"] },
          }),
          [id],
        );
        expect(result.results[0]?.present).toBe(true);
      }
    }),
  );

  it.effect("requires both kendra placement and own or exalted dignity", () =>
    Effect.gen(function* () {
      const wrongHouse = yield* evaluate(
        fixtures.calculationFromHouses({ Jupiter: 2 }, [1], {
          dignities: { Jupiter: ["EXALTED"] },
        }),
        ["hamsa"],
      );
      const wrongDignity = yield* evaluate(
        fixtures.calculationFromHouses({ Jupiter: 1 }, [1], { dignities: { Jupiter: ["FRIEND"] } }),
        ["hamsa"],
      );

      expect(wrongHouse.results[0]?.present).toBe(false);
      expect(wrongDignity.results[0]?.present).toBe(false);
    }),
  );

  it.effect("evaluates Kamala and Gada from whole-chart house distributions", () =>
    Effect.gen(function* () {
      const kamala = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 1,
          Moon: 4,
          Mars: 7,
          Mercury: 10,
          Jupiter: 1,
          Venus: 4,
          Saturn: 7,
          Rahu: 10,
          Ketu: 1,
        }),
        ["kamala"],
      );
      const gada = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 1,
          Moon: 4,
          Mars: 1,
          Mercury: 4,
          Jupiter: 1,
          Venus: 4,
          Saturn: 1,
          Rahu: 4,
          Ketu: 1,
        }),
        ["gada"],
      );

      expect(kamala.results[0]?.present).toBe(true);
      expect(gada.results[0]?.present).toBe(true);
    }),
  );

  it.effect("rejects whole-chart distributions with a planet outside the required houses", () =>
    Effect.gen(function* () {
      const kamala = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 1,
          Moon: 4,
          Mars: 7,
          Mercury: 10,
          Jupiter: 1,
          Venus: 4,
          Saturn: 7,
          Rahu: 10,
          Ketu: 2,
        }),
        ["kamala"],
      );
      const gada = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 1,
          Moon: 4,
          Mars: 1,
          Mercury: 4,
          Jupiter: 1,
          Venus: 4,
          Saturn: 1,
          Rahu: 4,
          Ketu: 7,
        }),
        ["gada"],
      );

      expect(kamala.results[0]?.present).toBe(false);
      expect(gada.results[0]?.present).toBe(false);
    }),
  );

  it.effect("evaluates Vapee and Samudra from whole-chart distributions", () =>
    Effect.gen(function* () {
      const vapee = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 2,
          Moon: 5,
          Mars: 8,
          Mercury: 11,
          Jupiter: 2,
          Venus: 5,
          Saturn: 8,
          Rahu: 11,
          Ketu: 2,
        }),
        ["vapee"],
      );
      const samudra = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 2,
          Moon: 4,
          Mars: 6,
          Mercury: 8,
          Jupiter: 10,
          Venus: 12,
          Saturn: 2,
          Rahu: 4,
          Ketu: 6,
        }),
        ["samudra"],
      );

      expect(vapee.results[0]?.present).toBe(true);
      expect(samudra.results[0]?.present).toBe(true);
    }),
  );

  it.effect("evaluates the latest house-lord Yoga additions", () =>
    Effect.gen(function* () {
      const cases = [
        ["duryoga", { Saturn: 6 }],
        ["daridra", { Saturn: 8 }],
        ["harsha", { Mercury: 6 }],
        ["sarala", { Mars: 8 }],
        ["vimala", { Jupiter: 12 }],
        ["siva", { Sun: 9, Jupiter: 10, Saturn: 5 }],
        ["sareera_soukhya", { Jupiter: 4 }],
      ] as const;

      for (const [id, houses] of cases) {
        const result = yield* evaluate(fixtures.calculationFromHouses(houses), [id]);
        expect(result.results[0]?.present).toBe(true);
      }
    }),
  );

  it.effect("rejects Vapee and Samudra when a graha breaks the distribution", () =>
    Effect.gen(function* () {
      const vapee = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 2,
          Moon: 5,
          Mars: 8,
          Mercury: 11,
          Jupiter: 2,
          Venus: 5,
          Saturn: 8,
          Rahu: 11,
          Ketu: 1,
        }),
        ["vapee"],
      );
      const samudra = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 2,
          Moon: 4,
          Mars: 6,
          Mercury: 8,
          Jupiter: 10,
          Venus: 12,
          Saturn: 2,
          Rahu: 4,
          Ketu: 1,
        }),
        ["samudra"],
      );

      expect(vapee.results[0]?.present).toBe(false);
      expect(samudra.results[0]?.present).toBe(false);
    }),
  );

  it.effect("evaluates the sign-cardinality Yoga group", () =>
    Effect.gen(function* () {
      const cases = [
        ["vallaki", [1, 2, 3, 4, 5, 6, 7, 1, 2]],
        ["damni", [1, 2, 3, 4, 5, 6, 1, 2, 3]],
        ["pasa", [1, 2, 3, 4, 5, 1, 2, 3, 4]],
        ["kedara", [1, 2, 3, 4, 1, 2, 3, 4, 1]],
        ["sula", [1, 2, 3, 1, 2, 3, 1, 2, 3]],
        ["yuga", [1, 2, 1, 2, 1, 2, 1, 2, 1]],
      ] as const;

      for (const [id, houses] of cases) {
        const result = yield* evaluate(
          fixtures.calculationFromHouses(
            Object.fromEntries(
              ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"].map(
                (planet, index) => [planet, houses[index]],
              ),
            ),
          ),
          [id],
        );
        expect(result.results[0]?.present).toBe(true);
      }
    }),
  );

  it.effect("counts exactly the seven classical planets without adding the lunar nodes", () =>
    Effect.gen(function* () {
      const result = yield* evaluate(
        fixtures.calculationFromHouses({
          Sun: 1,
          Moon: 2,
          Mars: 3,
          Mercury: 4,
          Jupiter: 5,
          Venus: 6,
          Saturn: 7,
          Rahu: 8,
          Ketu: 1,
        }),
        ["vallaki", "damni"],
      );

      expect(result.results[0]?.present).toBe(true);
      expect(result.results[1]?.present).toBe(false);
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
