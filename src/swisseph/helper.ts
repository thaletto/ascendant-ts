import { Effect, Function } from "effect";

import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";
import { EphemerisError } from "../ephemeris/error.js";
import { type CelestialBody } from "../ephemeris/model.js";
import { SIDEREAL_MODE, CELESTIAL_BODY, HOUSE_SYSTEM } from "./model.js";

export const normalizeAngle = Function.dual<
  (offset: number) => (angle: number) => number,
  (angle: number, offset: number) => number
>(2, (angle, offset) => (((angle - offset) % 360) + 360) % 360);

export const wholeSignCusps = Function.dual<
  (ascendant: number) => (houses: { cusps: number[]; ascendant: number }) => number[],
  (houses: { cusps: number[]; ascendant: number }, ascendant: number) => number[]
>(2, (houses, ascendant) =>
  Array.from({ length: 13 }, (_, index) => {
    if (index === 0) return houses.cusps[0] ?? 0;
    const firstCusp = Math.floor(ascendant / 30) * 30;
    return (firstCusp + (index - 1) * 30) % 360;
  }),
);

export const siderealModeOf = Effect.fn("Swisseph.siderealModeOf")(function* (
  ayanamsa: typeof Ayanamsa.Type,
) {
  const mode = SIDEREAL_MODE[ayanamsa];
  if (mode === undefined) {
    return yield* EphemerisError.make({
      operation: "siderealModeOf",
      cause: new Error(`Unknown ayanamsa: ${ayanamsa}`),
    });
  }
  return mode;
});

export const celestialBodyOf = Effect.fn("Swisseph.celestialBodyOf")(function* (
  body: CelestialBody,
) {
  const cb = CELESTIAL_BODY[body];
  if (cb === undefined) {
    return yield* EphemerisError.make({
      operation: "celestialBodyOf",
      cause: new Error(`Unknown celestial body: ${body}`),
    });
  }
  return cb;
});

export const houseSystemOf = Effect.fn("Swisseph.houseSystemOf")(function* (
  system: typeof HouseSystem.Type,
) {
  const hs = HOUSE_SYSTEM[system];
  if (hs === undefined) {
    return yield* EphemerisError.make({
      operation: "houseSystemOf",
      cause: new Error(`Unknown house system: ${system}`),
    });
  }
  return hs;
});
