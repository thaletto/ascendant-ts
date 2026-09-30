import { describe, expect, it } from "@effect/vitest";
import { Effect, Equal } from "effect";

import * as AstroParams from "../src/astro-params/index.js";

describe("AstroParams", () => {
  it("rejects unknown methodology values", () => {
    expect(() => AstroParams.Ayanamsa.make("Unknown" as never)).toThrow();
    expect(() => AstroParams.HouseSystem.make("Unknown" as never)).toThrow();
  });

  it.layer(AstroParams.DefaultAstroParams)((it) => {
    it.effect("provides default options through the service boundary", () =>
      Effect.gen(function* () {
        const defaults = yield* AstroParams.AstroParams;

        expect(
          Equal.equals(defaults, { ayanamsa: "KrishnamurtiVP291", houseSystem: "Placidus" }),
        ).toBe(true);
      }),
    );
  });

  it.layer(AstroParams.layer({ ayanamsa: "Raman", houseSystem: "Placidus" }))((it) => {
    it.effect("provides caller-selected options", () =>
      Effect.gen(function* () {
        const configured = yield* AstroParams.AstroParams;

        expect(Equal.equals(configured, { ayanamsa: "Raman", houseSystem: "Placidus" })).toBe(true);
      }),
    );
  });
});
