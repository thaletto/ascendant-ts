import { Context, Effect, Layer } from "effect";

import type { Placements } from "../../internal/model.js";
import { calculate } from "./calculate.js";
import type { Result } from "./model.js";
import { EvidenceError } from "./model.js";

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (placements: Placements) => Effect.Effect<Result, EvidenceError>;
  }
>()("astro-ascendant/jaimini/upapada/service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as Upapada, layer as UpapadaLayer };
