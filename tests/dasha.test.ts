import { describe, expect, it } from "@effect/vitest";
import { DateTime, Effect, Equal } from "effect";

import * as Dasha from "../src/dasha/index.js";
import { fixtures } from "./support/fixtures.js";

describe("Dasha", () => {
  it.layer(Dasha.DashaLayer)((it) => {
    it.effect("derives nine ordered Mahadashas and nested Antardashas", () =>
      Effect.gen(function* () {
        const service = yield* Dasha.Dasha;
        const result = yield* service.calculate(
          fixtures.moment(),
          fixtures.placementsFromLongitudes({ Moon: 40 }),
        );

        expect(result).toHaveLength(9);
        expect(
          Equal.equals(
            result.map(({ mahadasha }) => mahadasha),
            ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"],
          ),
        ).toBe(true);
        expect(result.every(({ antardashas }) => antardashas.length === 9)).toBe(true);
      }),
    );

    it.effect("reports a typed calculation error when the Moon evidence is absent", () =>
      Effect.gen(function* () {
        const service = yield* Dasha.Dasha;
        const exit = yield* Effect.exit(
          service.calculate(
            fixtures.moment(),
            fixtures.placementsFromLongitudes({}, { omit: ["Moon"] }),
          ),
        );

        expect(exit._tag).toBe("Failure");
        if (exit._tag === "Failure") expect(String(exit.cause)).toContain("DashaCalculationError");
      }),
    );

    it.effect("selects a Mahadasha at an inclusive start boundary", () =>
      Effect.gen(function* () {
        const service = yield* Dasha.Dasha;
        const timeline = yield* service.calculate(
          fixtures.moment(),
          fixtures.placementsFromLongitudes({ Moon: 40 }),
        );
        const result = yield* service.mahadasha(
          timeline,
          0,
          DateTime.makeUnsafe({ year: 2000, month: 1, day: 1 }),
        );

        expect(result).not.toBeNull();
      }),
    );
  });
});
