import { Context, Effect, Layer } from "effect";
import { AstroParams } from "../config/astro-params";
import { Ephemeris } from "../ephemeris/service";
import { ChartCalculation, ChartCalculationError, LocatedMoment } from "../types";
import { makeGenerate } from "./functions";

export class ChartService extends Context.Service<
  ChartService,
  {
    readonly generate: (
      input: LocatedMoment,
      divisions?: readonly number[],
    ) => Effect.Effect<ChartCalculation, ChartCalculationError>;
  }
>()("@app/ChartService") {
  static readonly layer = Layer.effect(
    ChartService,
    Effect.gen(function* () {
      const ephemeris = yield* Ephemeris;
      const astroParams = yield* AstroParams;

      return ChartService.of({
        generate: makeGenerate(ephemeris, astroParams),
      });
    }),
  );
}
