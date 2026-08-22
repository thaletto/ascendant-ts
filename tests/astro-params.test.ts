import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer } from "effect";
import * as AstroParams from "../src/astro-params/index.js";

const ramanPlacidusLayer = AstroParams.layerConfig(AstroParams.environmentConfig).pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({ AYANAMSA: "Raman", HOUSE_SYSTEM: "Placidus" }),
    ),
  ),
);

const malformedLayer = AstroParams.layerConfig(AstroParams.environmentConfig).pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({ AYANAMSA: "Unknown", HOUSE_SYSTEM: "WholeSign" }),
    ),
  ),
);

describe("AstroParams layers", () => {
  it.effect("provides explicit options", () =>
    Effect.gen(function* () {
      const params = yield* Effect.service(AstroParams.Service);
      expect(params).toEqual({ ayanamsa: "Raman", houseSystem: "Placidus" });
    }).pipe(Effect.provide(AstroParams.layer({ ayanamsa: "Raman", houseSystem: "Placidus" }))),
  );

  it.effect("provides Lahiri and WholeSign defaults", () =>
    Effect.gen(function* () {
      const params = yield* Effect.service(AstroParams.Service);
      expect(params).toEqual({ ayanamsa: "Lahiri", houseSystem: "WholeSign" });
    }).pipe(Effect.provide(AstroParams.defaultLayer)),
  );

  it.effect("decodes environment-backed configuration", () =>
    Effect.gen(function* () {
      const params = yield* Effect.service(AstroParams.Service);
      expect(params).toEqual({ ayanamsa: "Raman", houseSystem: "Placidus" });
    }).pipe(Effect.provide(ramanPlacidusLayer)),
  );

  it.effect("fails when environment-backed configuration is malformed", () =>
    Effect.service(AstroParams.Service).pipe(
      Effect.provide(malformedLayer),
      Effect.flip,
      Effect.map((error) => expect(error._tag).toBe("ConfigError")),
    ),
  );
});
