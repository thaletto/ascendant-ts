import { describe, expect, it } from "@effect/vitest";
import { Array, Effect, Equal } from "effect";

import * as Dasha from "../src/dasha/index.js";
import { fixtures } from "./support/fixtures.js";

describe("Dasha", () => {
  it.effect("derives nine ordered Mahadashas with typed UTC intervals", () =>
    Effect.gen(function* () {
      const timeline = yield* Dasha.calculate(
        fixtures.moment(),
        fixtures.placementsFromLongitudes({ Moon: 40 }),
      );

      expect(timeline).toHaveLength(9);
      expect(
        Equal.equals(
          timeline.map(({ mahadasha }) => mahadasha),
          ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"],
        ),
      ).toBe(true);
      expect(timeline.every(({ antardashas }) => antardashas.length === 9)).toBe(true);
      expect(
        timeline.every(({ start, end }) => start.epochMilliseconds < end.epochMilliseconds),
      ).toBe(true);
    }),
  );

  it.effect("reports a typed calculation error when the Moon evidence is absent", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        Dasha.calculate(
          fixtures.moment(),
          fixtures.placementsFromLongitudes({}, { omit: ["Moon"] }),
        ),
      );

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") expect(String(exit.cause)).toContain("DashaCalculationError");
    }),
  );

  it.effect("finds the active periods using half-open UTC intervals", () =>
    Effect.gen(function* () {
      const timeline = yield* Dasha.calculate(
        fixtures.moment(),
        fixtures.placementsFromLongitudes({ Moon: 40 }),
      );
      const first = Array.getUnsafe(timeline, 0);
      const current = yield* Dasha.at(timeline, first.start);
      const atEnd = yield* Dasha.at(timeline, Array.getUnsafe(timeline, timeline.length - 1).end);

      expect(current?.mahadasha.mahadasha).toBe(first.mahadasha);
      expect(current?.antardasha.antardasha).toBe(first.antardashas[0]?.antardasha);
      expect(atEnd).toBeNull();
    }),
  );
});
