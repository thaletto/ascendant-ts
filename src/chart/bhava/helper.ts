import { Function } from "effect";

import type { Planet } from "../../internal/model.js";

export const normalizeAngle = Function.dual<(angle: number) => number, (angle: number) => number>(
  1,
  (angle) => ((angle % 360) + 360) % 360,
);

export const forwardDistance = Function.dual<
  (to: number) => (from: number) => number,
  (from: number, to: number) => number
>(2, (from, to) => normalizeAngle(to - from));

export const houseFor = Function.dual<
  (cusps: readonly number[], spans: readonly number[]) => (longitude: number) => number,
  (longitude: number, cusps: readonly number[], spans: readonly number[]) => number
>(3, (longitude, cusps, spans) =>
  cusps.findIndex((cusp, index) => {
    const span = spans[index];
    return span !== undefined && forwardDistance(cusp, longitude) < span;
  }),
);

export const distributePlanets = Function.dual<
  (
    cusps: readonly number[],
    spans: readonly number[],
  ) => (planets: readonly Planet[]) => readonly (readonly Planet[])[],
  (
    planets: readonly Planet[],
    cusps: readonly number[],
    spans: readonly number[],
  ) => readonly (readonly Planet[])[]
>(3, (planets, cusps, spans) => {
  const planetsByHouse: Planet[][] = Array.from({ length: 12 }, () => []);

  for (const planet of planets) {
    const houseIndex = houseFor(planet.longitude, cusps, spans);
    const housePlanets = planetsByHouse[houseIndex];
    if (housePlanets === undefined) {
      throw new Error("Could not calculate Bhava chart");
    }
    housePlanets.push(planet);
  }

  return planetsByHouse;
});
