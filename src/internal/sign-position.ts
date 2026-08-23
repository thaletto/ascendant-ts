import { RASHI_NAMES } from "../chart/literals.js";
import { type Longitude, Rashis } from "../chart/model.js";

export function signAt(index: number): typeof Rashis.Type {
  const normalized = ((index % RASHI_NAMES.length) + RASHI_NAMES.length) % RASHI_NAMES.length;
  const sign = RASHI_NAMES[normalized];
  if (sign === undefined) throw new Error(`Missing Sign at index ${normalized}`);
  return sign;
}

export function signIndexOf(longitude: Longitude): number {
  return Math.floor(longitude / 30) % RASHI_NAMES.length;
}
