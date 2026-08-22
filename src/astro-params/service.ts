import { Config, Context, Effect, Layer } from "effect";
import { Ayanamsa, HouseSystem, type Options } from "./model.js";

export interface Service {
  readonly ayanamsa: typeof Ayanamsa.Type;
  readonly houseSystem: typeof HouseSystem.Type;
}

export const Service = Context.Service<Service>("astro-ascendant/astro-params/Service");

export function layer(options: Options): Layer.Layer<Service> {
  return Layer.succeed(Service, Service.of(options));
}

export const defaultLayer = layer({
  ayanamsa: "Lahiri",
  houseSystem: "WholeSign",
});

export function layerConfig(config: Config.Wrap<Options>) {
  return Layer.effect(
    Service,
    Config.unwrap(config).pipe(Effect.map((options) => Service.of(options))),
  );
}

export const environmentConfig = {
  ayanamsa: Config.schema(Ayanamsa, "AYANAMSA").pipe(Config.withDefault("Lahiri")),
  houseSystem: Config.schema(HouseSystem, "HOUSE_SYSTEM").pipe(Config.withDefault("WholeSign")),
};
