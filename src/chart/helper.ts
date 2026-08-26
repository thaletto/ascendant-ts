import { Array, Function } from "effect";

import {
  NAKSHATRAS,
  NAKSHATRA_SPAN,
  NAKSHATRA_LORD_CYCLE,
  DIGNITY_RANGES,
} from "./internal/constants.js";
import { normalize } from "./internal/position.js";
import { type Longitude, Nakshatra, type PlanetDignity, type Planets } from "./model.js";

export function nakshatraOf(longitude: Longitude): Nakshatra {
  const position = normalize(longitude);
  const index = Math.floor(position / NAKSHATRA_SPAN);
  const pada = Math.floor(((position % NAKSHATRA_SPAN) / NAKSHATRA_SPAN) * 4) + 1;
  return Nakshatra.make({
    name: Array.getUnsafe(NAKSHATRAS, index),
    lord: Array.getUnsafe(NAKSHATRA_LORD_CYCLE, index % NAKSHATRA_LORD_CYCLE.length),
    pada: pada as 1 | 2 | 3 | 4,
  });
}

export const inSignStatus = Function.dual<
  (longitude: number) => (planet: Planets) => ReadonlyArray<PlanetDignity>,
  (planet: Planets, longitude: number) => ReadonlyArray<PlanetDignity>
>(2, (planet, longitude) => {
  const normalized = ((longitude % 360) + 360) % 360;
  const planetDignityMap = DIGNITY_RANGES[planet];

  const match = planetDignityMap.find(({ ranges }) =>
    ranges.some(([from, to]) => normalized >= from && normalized < to),
  );

  return match !== undefined ? [match.dignity] : [];
});
