import { Effect } from "effect";

import type { Placements } from "../../internal/model.js";
import { calculateUpapada } from "./helper.js";
import type { Result } from "./model.js";
import { Provenance } from "./model.js";

export const calculate = Effect.fn("Upapada.calculate")(function* (placements: Placements) {
  const arudhaPada = yield* calculateUpapada(placements);

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "twelfth-house-plain-projection" as const,
      version: 1 as const,
    } satisfies Provenance,
    house: 12 as const,
    sourceSign: arudhaPada.sourceSign,
    lord: arudhaPada.lord,
    lordSign: arudhaPada.lordSign,
    sign: arudhaPada.sign,
  } satisfies Result;
});
