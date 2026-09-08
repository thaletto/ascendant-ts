import { Array, Function, Option } from "effect";

import type { Planet } from "./model.js";

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

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
>(3, (planets, cusps, spans) =>
  planets.reduce(
    (planetsByHouse, planet) => {
      const houseIndex = houseFor(planet.longitude, cusps, spans);
      return Option.match(Array.get(houseIndex)(planetsByHouse), {
        onNone: () => planetsByHouse,
        onSome: (housePlanets) =>
          Option.getOrElse(
            Array.modify(planetsByHouse, houseIndex, () => [...housePlanets, planet]),
            () => planetsByHouse,
          ),
      });
    },
    Array.replicate(12)([] as readonly Planet[]),
  ),
);
