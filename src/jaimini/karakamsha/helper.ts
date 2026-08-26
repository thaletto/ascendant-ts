import { RASHIS } from "../../internal/constant.js";
import type { Rashis } from "../../internal/model.js";

export function signOf(signIndex: number): Rashis {
  const sign = RASHIS[signIndex];
  if (sign === undefined) throw new Error(`Missing sign at index ${signIndex}`);
  return sign;
}
