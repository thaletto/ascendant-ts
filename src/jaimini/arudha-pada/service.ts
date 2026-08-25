import { Context, Effect, Layer } from "effect";

import type { Placements } from "../../internal/model.js";
import { Houses } from "../../internal/model.js";
import { calculate } from "./calculate.js";
import type { Result } from "./model.js";
import { EvidenceError } from "./model.js";

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (
      placements: Placements,
      house: Houses,
    ) => Effect.Effect<Result, EvidenceError>;
  }
>()("astro-ascendant/jaimini/arudha-pada/service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as ArudhaPada, layer as ArudhaPadaLayer };
