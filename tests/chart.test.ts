import { describe, expect, it } from "@effect/vitest";
import { Array, Effect, Equal, Layer, Record, Schema } from "effect";

import * as AstroParams from "../src/astro-params/index.js";
import * as Chart from "../src/chart/index.js";
import { EphemerisTestLayer } from "./support/ephemeris.js";
import { fixtures } from "./support/fixtures.js";

describe("Chart projections", () => {
  it("validates optional sex on chart parameters", () => {
    const input = fixtures.locatedMoment();
    expect(Chart.ChartParams.make(input)).not.toHaveProperty("sex");
    for (const sex of Chart.Sex.literals) {
      expect(
        Chart.ChartParams.make({
          moment: input.moment,
          latitude: input.latitude,
          longitude: input.longitude,
          sex,
        }).sex,
      ).toBe(sex);
    }
    const decode = Schema.decodeUnknownSync(Chart.ChartParams);
    const values = { moment: input.moment, latitude: input.latitude, longitude: input.longitude };
    expect(() => decode({ ...values, sex: "Unknown" })).toThrow();
    expect(() => decode({ ...values, sex: null })).toThrow();
  });

  it.effect("preserves sex through direct projection and chart schema round trips", () =>
    Effect.gen(function* () {
      for (const sex of Chart.Sex.literals) {
        const charts = yield* Chart.project(fixtures.placementsFromLongitudes(), [9, 10], sex);
        for (const chart of charts) {
          const encoded = yield* Schema.encodeEffect(Chart.Chart)(chart);
          expect(encoded.sex).toBe(sex);
          const decoded = yield* Schema.decodeEffect(Chart.Chart)(encoded);
          expect(decoded.sex).toBe(sex);
          expect(() =>
            Schema.decodeUnknownSync(Chart.Chart)({
              provenance: encoded.provenance,
              division: encoded.division,
              houses: encoded.houses,
              sex: "Unknown",
            }),
          ).toThrow();
        }
      }
      const [legacy] = yield* Chart.project(fixtures.placementsFromLongitudes());
      const encoded = yield* Schema.encodeEffect(Chart.Chart)(legacy);
      expect(encoded).not.toHaveProperty("sex");
      expect(yield* Schema.decodeEffect(Chart.Chart)(encoded)).not.toHaveProperty("sex");
    }),
  );

  it.effect("always includes D1 and deduplicates requested divisional charts", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.project(fixtures.placementsFromLongitudes(), [10, 9, 9, 1]);

      expect(
        Equal.equals(
          charts.map(({ division }) => division),
          [1, 9, 10],
        ),
      ).toBe(true);
    }),
  );

  it.layer(
    Layer.merge(
      AstroParams.layer({ ayanamsa: "Raman", houseSystem: "Placidus" }),
      EphemerisTestLayer,
    ),
  )((it) => {
    it.effect("copies supplied sex into every generated chart", () =>
      Effect.gen(function* () {
        for (const sex of Chart.Sex.literals) {
          const moment = fixtures.locatedMoment();
          const input = Chart.ChartParams.make({
            moment: moment.moment,
            latitude: moment.latitude,
            longitude: moment.longitude,
            sex,
          });
          const calculation = yield* Chart.generate(input, [9, 10]);
          expect(calculation.charts.map((chart) => chart.sex)).toEqual([sex, sex, sex]);
        }
      }),
    );

    it.effect("generates one atomic calculation through the public interface", () =>
      Effect.gen(function* () {
        const calculation = yield* Chart.generate(fixtures.locatedMoment(), [9, 9]);
        for (const chart of calculation.charts) {
          expect(chart).not.toHaveProperty("sex");
        }

        expect(
          Equal.equals(
            calculation.charts.map(({ division }) => division),
            [1, 9],
          ),
        ).toBe(true);
        expect(
          Equal.equals(
            calculation.astroParams,
            AstroParams.Options.make({ ayanamsa: "Raman", houseSystem: "Placidus" }),
          ),
        ).toBe(true);
        expect(calculation.bhava.houses[1].cusp).toBe(0);
      }),
    );
  });

  it.effect("derives D1 as an identity projection from Placements", () =>
    Effect.gen(function* () {
      const [chart] = yield* Chart.project(fixtures.placementsFromLongitudes());

      expect(chart.division).toBe(1);
      expect(
        Equal.equals(chart.provenance, {
          school: "Ascendant",
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
      const charts = yield* Chart.project(fixtures.placementsFromLongitudes(), [1, 9, 10]);

      expect(
        Equal.equals(
          charts.map(({ division }) => division),
          [1, 9, 10],
        ),
      ).toBe(true);
      expect(charts.every(({ houses }) => Record.size(houses) === 12)).toBe(true);
    }),
  );

  it.effect("keeps source retrograde state while remapping longitude and sign", () =>
    Effect.gen(function* () {
      const placements = fixtures.placementsFromLongitudes({ Saturn: 190 });
      const charts = yield* Chart.project(placements, [9]);
      const chart = charts[1];
      if (chart === undefined) return yield* Effect.die("Expected a D9 chart");
      const saturn = Record.values(chart.houses)
        .flatMap(({ planets }) => planets)
        .find(({ name }) => name === "Saturn");

      expect(saturn?.is_retrograde).toBe(false);
      expect(saturn?.longitude).toBeGreaterThanOrEqual(0);
    }),
  );

  it.effect("derives dignity from each division's mapped sign", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.project(fixtures.placementsFromLongitudes({ Jupiter: 95 }), [9]);
      const jupiters = charts.map((chart) =>
        Record.values(chart.houses)
          .flatMap(({ planets }) => planets)
          .find(({ name }) => name === "Jupiter"),
      );

      expect(jupiters[0]?.sign.name).toBe("Cancer");
      expect(jupiters[0]?.in_sign).toEqual(["EXALTED"]);
      expect(jupiters[1]?.sign.name).toBe("Leo");
      expect(jupiters[1]?.in_sign).toEqual(["FRIEND"]);
    }),
  );
});
