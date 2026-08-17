import { Config, Context, Effect, Layer } from "effect";
import { Ayanamsa, HouseSystemName } from "../types";

export class AstroParams extends Context.Service<
  AstroParams,
  {
    readonly ayanamsa: typeof Ayanamsa.Type;
    readonly houseSystem: typeof HouseSystemName.Type;
  }
>()("@app/AstroParams") {
  static readonly layer = Layer.effect(
    AstroParams,
    Effect.gen(function* () {
      const ayanamsa = yield* Config.schema(Ayanamsa, "AYANAMSA").pipe(
        Config.withDefault("Lahiri"),
      );
      const houseSystem = yield* Config.schema(HouseSystemName, "HOUSE_SYSTEM").pipe(
        Config.withDefault("WholeSign"),
      );
      return AstroParams.of({ ayanamsa, houseSystem });
    }),
  );
}
