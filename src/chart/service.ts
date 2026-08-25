import { Context, Effect, Layer } from "effect";

import { AstroParams } from "../astro-params/service.js";
import { Ephemeris } from "../ephemeris/service.js";
import { ChartCalculation, LocatedMoment, type Division } from "../internal/model.js";
import { ChartCalculationError, LocatedMomentValidationError } from "./error.js";
import { generate } from "./generate.js";

class Service extends Context.Service<
  Service,
  {
    readonly generate: (
      input: LocatedMoment,
      divisions: readonly [Division, ...Division[]],
    ) => Effect.Effect<
      ChartCalculation,
      ChartCalculationError | LocatedMomentValidationError,
      AstroParams | Ephemeris
    >;
  }
>()("astro-ascendant/chart/service") {}

const layer = Layer.succeed(
  Service,
  Service.of({
    generate,
  }),
);

export { Service as Chart, layer as ChartLayer };
