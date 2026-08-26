import { Array } from "effect";

import { Longitude, type Rashis } from "../model.js";
import { RASHIS } from "./constants.js";

export function signAt(index: number): Rashis {
  const normalized = ((index % RASHIS.length) + RASHIS.length) % RASHIS.length;
  return Array.getUnsafe(RASHIS, normalized);
}

export function signIndexOf(longitude: Longitude): number {
  return Math.floor(longitude / 30) % RASHIS.length;
}

export function normalize(longitude: Longitude): Longitude {
  return Longitude.make(((longitude % 360) + 360) % 360);
}
