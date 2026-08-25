import { Context, Layer } from "effect";

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

export { Service as AstroParams, defaultLayer as DefaultAstroParams };
