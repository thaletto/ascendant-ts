import { Effect } from "effect";

import type { Placements } from "../../chart/model.js";
import { methods } from "../../provenance.js";
import { calculateUpapada } from "./helper.js";
import type { Result } from "./model.js";

/**
 * Returns the twelfth-house Arudha Pada as Upapada. It delegates the projection
 * to the shared Arudha calculation while exposing its own Jaimini provenance and
 * typed evidence failures.
 */
export const calculate = Effect.fn("Upapada.calculate")(function* (placements: Placements) {
  const arudhaPada = yield* calculateUpapada(placements);

  return {
    provenance: methods.jaiminiUpapada.provenance,
    house: 12 as const,
    sourceSign: arudhaPada.sourceSign,
    lord: arudhaPada.lord,
    lordSign: arudhaPada.lordSign,
    sign: arudhaPada.sign,
  } satisfies Result;
});
