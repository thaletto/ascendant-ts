import { Context, Effect, Layer } from "effect";
import { Service as AstroParams } from "../astro-params/service.js";
import { Service as Ephemeris } from "../ephemeris/service.js";
import { ChartCalculationError, LocatedMomentValidationError } from "./error.js";
import { makeGenerate } from "./generate.js";
import { ChartCalculation, LocatedMoment } from "./model.js";

export interface Service {
  readonly generate: (
    input: LocatedMoment,
    divisions?: readonly number[],
  ) => Effect.Effect<ChartCalculation, ChartCalculationError | LocatedMomentValidationError>;
}

export const Service = Context.Service<Service>("astro-ascendant/chart/Service");

export const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const ephemeris = yield* Effect.service(Ephemeris);
    const astroParams = yield* Effect.service(AstroParams);

    return Service.of({
      generate: makeGenerate(ephemeris, astroParams),
    });
  }),
);
