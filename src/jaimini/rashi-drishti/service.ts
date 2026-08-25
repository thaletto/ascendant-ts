import { Context, Effect, Layer } from "effect";

import type { Rashis } from "../../internal/model.js";
import { calculate } from "./calculate.js";
import type { Result } from "./model.js";

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (reference: Rashis) => Effect.Effect<Result>;
  }
>()("astro-ascendant/jaimini/rashi-drishti/service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as RashiDrishti, layer as RashiDrishtiLayer };
