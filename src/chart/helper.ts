import { Array, Effect, Function, Option } from "effect";

import { normalizeLongitude } from "../utils/position.js";
import {
  STARS,
  STAR_SPAN,
  STAR_LORD_CYCLE,
  DIGNITY_RANGES,
  VIMSHOTTARI_CYCLE_YEARS,
  VIMSHOTTARI_YEARS,
} from "./internal/constants.js";
import { type Longitude, Star, type PlanetDignity, type Planets } from "./model.js";

export const starOf = Effect.fn(function* (longitude: Longitude) {
  const position = yield* normalizeLongitude(longitude);
  const index = Math.floor(position / STAR_SPAN);
  const pada = Math.floor(((position % STAR_SPAN) / STAR_SPAN) * 4) + 1;
  return Star.make({
    name: Array.getUnsafe(STARS, index),
    lord: Array.getUnsafe(STAR_LORD_CYCLE, index % STAR_LORD_CYCLE.length),
    pada: pada as 1 | 2 | 3 | 4,
  });
});

export const subLordOf = Effect.fn(function* (longitude: Longitude) {
  const star = yield* starOf(longitude);
  const offset = (yield* normalizeLongitude(longitude)) % STAR_SPAN;
  const sequenceStart = STAR_LORD_CYCLE.indexOf(star.lord);
  const position = offset / STAR_SPAN;
  const cyclePlanet = (index: number): Planets =>
    Option.getOrElse(Array.get(index)(STAR_LORD_CYCLE), () => star.lord);
  const ordered = Array.range(0, STAR_LORD_CYCLE.length - 1).map((index) =>
    cyclePlanet((sequenceStart + index) % STAR_LORD_CYCLE.length),
  );
  const lord = Array.findFirstWithIndex(ordered, (planet, index) => {
    const elapsed = ordered
      .slice(0, index)
      .reduce((total, priorPlanet) => total + VIMSHOTTARI_YEARS[priorPlanet] / VIMSHOTTARI_CYCLE_YEARS, 0);
    return position < elapsed + VIMSHOTTARI_YEARS[planet] / VIMSHOTTARI_CYCLE_YEARS;
  });

  return Option.match(lord, {
    onNone: () => star.lord,
    onSome: ([planet]) => planet,
  });
});

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
