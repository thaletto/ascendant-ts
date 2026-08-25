import { Context, Effect, Layer } from "effect";

import type { Placements } from "../../internal/model.js";
import { calculate } from "./calculate.js";
import type { Result } from "./model.js";
import { CalculationError, EvidenceError } from "./model.js";

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (
      placements: Placements,
    ) => Effect.Effect<Result, EvidenceError | CalculationError>;
  }
>()("astro-ascendant/jaimini/karakamsha/service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as Karakamsha, layer as KarakamshaLayer };
