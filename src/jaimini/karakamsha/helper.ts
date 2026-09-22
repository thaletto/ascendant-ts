import { Effect } from "effect";

import { RASHIS } from "../../chart/internal/constants.js";
import type { Rashis } from "../../chart/model.js";
import { CalculationError } from "./model.js";

export const signOf = Effect.fn("Karakamsha.signOf")(function* (signIndex: number) {
  const sign: Rashis | undefined = RASHIS[signIndex];
  if (sign === undefined) {
    return yield* CalculationError.make({
      message: `Missing sign at index ${signIndex}`,
      cause: signIndex,
    });
  }
  return sign;
});
