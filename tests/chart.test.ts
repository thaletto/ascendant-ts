import { describe, expect, it } from "@effect/vitest";
import { Array, Effect, Equal, Record } from "effect";

import { chartFromPlacements, chartsFromPlacements } from "../src/chart/charts.js";
import { Division } from "../src/internal/model.js";
import { fixtures } from "./support/fixtures.js";

describe("Chart projections", () => {
  it.effect("derives D1 as an identity projection from Placements", () =>
    Effect.gen(function* () {
      const chart = yield* chartFromPlacements(fixtures.placementsFromLongitudes(), 1);

      expect(chart.division).toBe(1);
      expect(
        Equal.equals(chart.provenance, {
          method: "ascendant-divisional-mapping",
          version: "1",
        }),
      ).toBe(true);
      expect(chart.houses[1]?.lagna?.sign.name).toBe("Aries");
      expect(Array.contains(chart.houses[1]?.planets.map(({ name }) => name) ?? [], "Sun")).toBe(
        true,
      );
    }),
  );

  it.effect("returns requested divisions exactly once and in stable order", () =>
    Effect.gen(function* () {
      const charts = yield* chartsFromPlacements(fixtures.placementsFromLongitudes(), [1, 9, 10]);

      expect(
        Equal.equals(
          charts.map(({ division }) => division),
          [1, 9, 10],
        ),
      ).toBe(true);
      expect(charts.every(({ houses }) => Record.size(houses) === 12)).toBe(true);
      expect(Division.literals).toHaveLength(16);
    }),
  );

  it.effect("keeps source retrograde state while remapping longitude and sign", () =>
    Effect.gen(function* () {
      const placements = fixtures.placementsFromLongitudes({ Saturn: 190 });
      const chart = yield* chartFromPlacements(placements, 9);
      const saturn = Record.values(chart.houses)
        .flatMap(({ planets }) => planets)
        .find(({ name }) => name === "Saturn");

      expect(saturn?.is_retrograde).toBe(false);
      expect(saturn?.longitude).toBeGreaterThanOrEqual(0);
      expect(saturn?.sign.name).toBeDefined();
    }),
  );
});
