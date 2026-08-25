import { Config, Context, Effect, Layer } from "effect";

import { Ayanamsa, HouseSystem, type Options } from "./model.js";

class Service extends Context.Service<
  Service,
  {
    readonly ayanamsa: typeof Ayanamsa.Type;
    readonly houseSystem: typeof HouseSystem.Type;
  }
>()("astro-ascendant/astro-params/service") {}

function layer(options: Options) {
  return Layer.succeed(Service, Service.of(options));
}

const defaultLayer = layer({
  ayanamsa: "Lahiri",
  houseSystem: "WholeSign",
});

// function layerConfig(config: Config.Wrap<Options>) {
//   return Layer.effect(
//     Service,
//     Config.unwrap(config).pipe(Effect.map((options) => Service.of(options))),
//   );
// }

// const environmentConfig = {
//   ayanamsa: Config.schema(Ayanamsa, "AYANAMSA").pipe(Config.withDefault("Lahiri")),
//   houseSystem: Config.schema(HouseSystem, "HOUSE_SYSTEM").pipe(Config.withDefault("WholeSign")),
// };

export { Service as AstroParams, defaultLayer as DefaultAstroParams };
