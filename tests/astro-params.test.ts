import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import * as AstroParams from "../src/astro-params/index.js";

describe("AstroParams layers", () => {
  it.effect("provides explicit options", () =>
    Effect.gen(function* () {
      const params = yield* AstroParams.Service;
      expect(params).toEqual({ ayanamsa: "Raman", houseSystem: "Placidus" });
    }).pipe(Effect.provide(AstroParams.layer({ ayanamsa: "Raman", houseSystem: "Placidus" }))),
  );

  it.effect("provides Lahiri and WholeSign defaults", () =>
    Effect.gen(function* () {
      const params = yield* AstroParams.Service;
      expect(params).toEqual({ ayanamsa: "Lahiri", houseSystem: "WholeSign" });
    }).pipe(Effect.provide(AstroParams.defaultLayer)),
  );

  it.effect("decodes environment-backed configuration", () =>
    Effect.gen(function* () {
      const params = yield* AstroParams.Service;
      expect(params).toEqual({ ayanamsa: "Raman", houseSystem: "Placidus" });
    }).pipe(
      Effect.provide(AstroParams.layerConfig(AstroParams.environmentConfig)),
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromUnknown({ AYANAMSA: "Raman", HOUSE_SYSTEM: "Placidus" }),
        ),
      ),
    ),
  );

  it.effect("fails when environment-backed configuration is malformed", () =>
    Effect.gen(function* () {
      const error = yield* Effect.gen(function* () {
        return yield* AstroParams.Service;
      }).pipe(
        Effect.provide(AstroParams.layerConfig(AstroParams.environmentConfig)),
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({ AYANAMSA: "Unknown", HOUSE_SYSTEM: "WholeSign" }),
          ),
        ),
        Effect.flip,
      );

      expect(error._tag).toBe("ConfigError");
    }),
  );
});
