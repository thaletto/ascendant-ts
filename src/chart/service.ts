import { Context, Effect, Layer } from "effect";
import { Service as AstroParams } from "../astro-params/service.js";
import { Service as Ephemeris } from "../ephemeris/service.js";
import { ChartCalculationError } from "./error.js";
import { makeGenerate } from "./generate.js";
import { ChartCalculation, LocatedMoment } from "./model.js";

export class Service extends Context.Service<
  Service,
  {
    readonly generate: (
      input: LocatedMoment,
      divisions?: readonly number[],
    ) => Effect.Effect<ChartCalculation, ChartCalculationError>;
  }
>()("astro-ascendant/chart/Service") {
  static readonly layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      const ephemeris = yield* Ephemeris;
      const astroParams = yield* AstroParams;

      return Service.of({
        generate: makeGenerate(ephemeris, astroParams),
      });
    }),
  );
}

export const layer = Service.layer;
