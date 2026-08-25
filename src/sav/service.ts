import { Context, Effect, Layer } from "effect";

import type { Placements } from "../internal/model.js";
import { calculate } from "./calculate.js";
import { SAVCalculationError } from "./error.js";
import type { AshtakavargaResult } from "./model.js";

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (
      placements: Placements,
    ) => Effect.Effect<AshtakavargaResult, SAVCalculationError>;
  }
>()("astro-ascendant/sav/service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as SAV, layer as SAVLayer };
