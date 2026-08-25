import { Context, Effect, Layer } from "effect";

import type { Placements } from "../chart/model.js";
import { makeCalculate } from "./calculate.js";
import type { SAVCalculationError } from "./error.js";
import type { AshtakavargaResult } from "./model.js";

export interface Service {
  readonly calculate: (
    placements: Placements,
  ) => Effect.Effect<AshtakavargaResult, SAVCalculationError>;
}

export const Service = Context.Service<Service>("astro-ascendant/sav/Service");

export const layer = Layer.succeed(
  Service,
  Service.of({
    calculate: makeCalculate(),
  }),
);
