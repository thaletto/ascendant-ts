import { Function } from "effect";

import { RASHIS } from "../../internal/constant.js";
import type { Rashis } from "../../internal/model.js";

export const signOf = Function.dual<(signIndex: number) => Rashis, (signIndex: number) => Rashis>(
  1,
  (signIndex) => {
    const sign = RASHIS[signIndex];
    if (sign === undefined) throw new Error(`Missing sign at index ${signIndex}`);
    return sign;
  },
);
