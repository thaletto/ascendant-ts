import { describe, expect, it } from "@effect/vitest";
import { Array, Effect, Equal } from "effect";

import * as AstroParams from "../src/astro-params/index.js";

describe("AstroParams", () => {
  it("publishes the supported methodology vocabulary", () => {
    expect(Array.contains(AstroParams.Ayanamsa.literals, "Lahiri")).toBe(true);
    expect(Array.contains(AstroParams.Ayanamsa.literals, "Raman")).toBe(true);
    expect(Array.contains(AstroParams.HouseSystem.literals, "WholeSign")).toBe(true);
    expect(Array.contains(AstroParams.HouseSystem.literals, "Placidus")).toBe(true);
  });

  it("rejects unknown methodology values", () => {
    expect(() => AstroParams.Ayanamsa.make("Unknown" as never)).toThrow();
    expect(() => AstroParams.HouseSystem.make("Unknown" as never)).toThrow();
  });

  it.layer(AstroParams.DefaultAstroParams)((it) => {
    it.effect("provides default options through the service boundary", () =>
      Effect.gen(function* () {
        const defaults = yield* AstroParams.AstroParams;

        expect(Equal.equals(defaults, { ayanamsa: "Lahiri", houseSystem: "WholeSign" })).toBe(true);
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
