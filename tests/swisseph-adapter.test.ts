import { describe, expect, it } from "@effect/vitest";
import { Effect, Equal } from "effect";

import * as AstroParams from "../src/astro-params/index.js";
import * as Swisseph from "../src/swisseph/index.js";

describe("Swiss Ephemeris adapter boundary", () => {
  it("maps every supported public methodology to a native value", () => {
    for (const ayanamsa of AstroParams.Ayanamsa.literals) {
      expect(Swisseph.SIDEREAL_MODE[ayanamsa]).toBeDefined();
    }
    for (const houseSystem of AstroParams.HouseSystem.literals) {
      expect(Swisseph.HOUSE_SYSTEM[houseSystem]).toBeDefined();
    }
  });

  it("normalizes angles and creates whole-sign cusps without shifting ARMC", () => {
    expect(Swisseph.normalizeAngle(-5, 0)).toBe(355);
    expect(Swisseph.normalizeAngle(10, 5)).toBe(5);
    expect(
      Equal.equals(
        Swisseph.wholeSignCusps({ cusps: [99], ascendant: 100 }, 100),
        [99, 90, 120, 150, 180, 210, 240, 270, 300, 330, 0, 30, 60],
      ),
    ).toBe(true);
  });

  it.effect("returns typed errors for unknown adapter vocabulary", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(Swisseph.siderealModeOf("Unknown" as never));

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") expect(String(exit.cause)).toContain("EphemerisError");
    }),
  );
});
