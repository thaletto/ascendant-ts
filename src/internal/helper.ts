import { Effect } from "effect";

import { RASHIS } from "./constant.js";
import { Longitude } from "./model.js";

export const signAt = Effect.fn(function* (index: number) {
  const normalized = ((index % RASHIS.length) + RASHIS.length) % RASHIS.length;
  return RASHIS[normalized]!;
});

export function signIndexOf(longitude: Longitude): number {
  return Math.floor(longitude / 30) % RASHIS.length;
}

export function normalize(longitude: Longitude): Longitude {
  return Longitude.make(((longitude % 360) + 360) % 360);
}
