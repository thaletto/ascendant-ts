import { RASHIS } from "../../chart/internal/constants.js";
import type { Rashis } from "../../chart/model.js";

export function signOf(signIndex: number): Rashis {
  const sign = RASHIS[signIndex];
  if (sign === undefined) throw new Error(`Missing sign at index ${signIndex}`);
  return sign;
}
