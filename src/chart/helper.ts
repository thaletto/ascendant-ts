import { Array, Function, Option } from "effect";

import {
  NAKSHATRAS,
  NAKSHATRA_SPAN,
  NAKSHATRA_LORD_CYCLE,
  DIGNITY_RANGES,
  VIMSHOTTARI_YEARS,
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

export function subLordOf(longitude: Longitude): Planets {
  const nakshatra = nakshatraOf(longitude);
  const offset = normalize(longitude) % NAKSHATRA_SPAN;
  const sequenceStart = NAKSHATRA_LORD_CYCLE.indexOf(nakshatra.lord);
  const position = offset / NAKSHATRA_SPAN;
  const cyclePlanet = (index: number): Planets =>
    Option.getOrElse(Array.get(index)(NAKSHATRA_LORD_CYCLE), () => nakshatra.lord);
  const lord = Array.findFirstWithIndex(
    Array.range(0, NAKSHATRA_LORD_CYCLE.length - 1).map((index) =>
      cyclePlanet((sequenceStart + index) % NAKSHATRA_LORD_CYCLE.length),
    ),
    (planet, index) => {
      const elapsed = Array.range(0, index).reduce((total, priorIndex) => {
        const priorPlanet = cyclePlanet((sequenceStart + priorIndex) % NAKSHATRA_LORD_CYCLE.length);
        return total + VIMSHOTTARI_YEARS[priorPlanet] / 120;
      }, 0);
      return position < elapsed + VIMSHOTTARI_YEARS[planet] / 120;
    },
  );

  return Option.match(lord, {
    onNone: () => nakshatra.lord,
    onSome: ([planet]) => planet,
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
