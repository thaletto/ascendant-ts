import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import { getDivisionalTarget } from "../src/chart/divisional-mapping/index.js";
import { Division } from "../src/chart/index.js";

describe("getDivisionalTarget", () => {
  it.effect.each([
    [1, 0, 10],
    [2, 0, 20],
    [3, 4, 0],
    [4, 3, 10],
    [7, 2, 10],
    [9, 3, 0],
    [10, 3, 10],
    [12, 4, 0],
    [16, 5, 10],
    [20, 6, 20],
    [24, 0, 0],
    [27, 9, 0],
    [30, 8, 0],
    [40, 1, 10],
    [45, 3, 0],
    [60, 8, 0],
  ] as const)("maps 10° Aries into D%s", ([division, signIndex, degree]) =>
    Effect.gen(function* () {
      const target = yield* getDivisionalTarget(10, division);

      expect(target.signIndex).toBe(signIndex);
      expect(target.degree).toBeCloseTo(degree, 10);
      expect(target.longitude).toBeCloseTo(signIndex * 30 + degree, 10);
    }),
  );

  it.effect.each([
    [2, 1],
    [3, 4],
    [4, 3],
    [7, 1],
    [9, 1],
    [10, 1],
    [12, 1],
    [16, 1],
    [20, 1],
    [24, 5],
    [27, 1],
    [30, 0],
    [40, 1],
    [45, 1],
    [60, 1],
  ] as const)("starts the second equal part of D%s at 0°", ([division, signIndex]) =>
    Effect.gen(function* () {
      const boundary = 30 / division;
      const below = yield* getDivisionalTarget(boundary - 1e-10, division);
      const at = yield* getDivisionalTarget(boundary, division);

      expect(below.degree).toBeGreaterThan(29.999999);
      expect(at.signIndex).toBe(signIndex);
      expect(at.degree).toBeCloseTo(0, 10);
    }),
  );

  it.effect("keeps every equal-part boundary half-open for every supported Division", () =>
    Effect.gen(function* () {
      for (const division of Division.literals) {
        if (division === 1) continue;
        const partSize = 30 / division;
        for (let part = 1; part < division; part++) {
          const boundary = part * partSize;
          const below = yield* getDivisionalTarget(boundary - 1e-10, division);
          const at = yield* getDivisionalTarget(boundary, division);
          const above = yield* getDivisionalTarget(boundary + 1e-10, division);

          expect(below.degree, `D${division} below part ${part}`).toBeGreaterThan(29.999999);
          expect(at.degree, `D${division} at part ${part}`).toBeCloseTo(0, 9);
          expect(above.degree, `D${division} above part ${part}`).toBeLessThan(1e-7);
        }
      }
    }),
  );

  it.effect.each([
    [7, 9],
    [9, 0],
    [10, 0],
    [16, 9],
    [20, 2],
    [24, 11],
    [40, 7],
    [45, 7],
  ] as const)("applies the D%s parity or modality rule to 10° Taurus", ([division, signIndex]) =>
    Effect.gen(function* () {
      const target = yield* getDivisionalTarget(40, division);
      expect(target.signIndex).toBe(signIndex);
    }),
  );

  it.effect.each([
    [4.999999, 0],
    [5, 10],
    [9.999999, 10],
    [10, 8],
    [17.999999, 8],
    [18, 2],
    [24.999999, 2],
    [25, 6],
    [34.999999, 1],
    [35, 5],
    [41.999999, 5],
    [42, 11],
    [49.999999, 11],
    [50, 9],
    [54.999999, 9],
    [55, 7],
  ] as const)("uses the specified D30 band at %s°", ([longitude, signIndex]) =>
    Effect.gen(function* () {
      const target = yield* getDivisionalTarget(longitude, 30);
      expect(target.signIndex).toBe(signIndex);
    }),
  );

  it.effect("normalizes source longitudes before mapping", () =>
    Effect.gen(function* () {
      const wrapped = yield* getDivisionalTarget(370, 1);
      const negative = yield* getDivisionalTarget(-10, 1);

      expect(wrapped).toMatchObject({ signIndex: 0, longitude: 10, degree: 10 });
      expect(negative).toMatchObject({ signIndex: 11, longitude: 350, degree: 20 });
    }),
  );

  it.effect("keeps every source-sign transition half-open from 0° through 330°", () =>
    Effect.gen(function* () {
      for (let signIndex = 0; signIndex < 12; signIndex++) {
        const boundary = signIndex * 30;
        const below = yield* getDivisionalTarget(boundary - 1e-10, 1);
        const at = yield* getDivisionalTarget(boundary, 1);
        const above = yield* getDivisionalTarget(boundary + 1e-10, 1);

        expect(below.signIndex, `below ${boundary}°`).toBe((signIndex + 11) % 12);
        expect(at, `at ${boundary}°`).toMatchObject({ signIndex, degree: 0 });
        expect(above.signIndex, `above ${boundary}°`).toBe(signIndex);
      }
    }),
  );

  it.effect("rejects a non-finite source longitude", () =>
    Effect.gen(function* () {
      const error = yield* getDivisionalTarget(Number.NaN, 9).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "DivisionalMappingError",
        message: "Longitude must be finite",
      });
    }),
  );
});
