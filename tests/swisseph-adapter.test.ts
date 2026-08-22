import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Ephemeris from "../src/ephemeris/index.js";
import * as Swisseph from "../src/swisseph/index.js";

describe("Swiss Ephemeris adapter", () => {
  it.effect("translates native results into Ascendant-owned values", () =>
    Effect.gen(function* () {
      const ephemeris = yield* Effect.service(Ephemeris.Service);
      const julianDay = yield* ephemeris.dateToJulianDay(new Date("2000-01-01T12:00:00.000Z"));
      const position = yield* ephemeris.calculatePosition(julianDay, "Sun", "Lahiri");
      const houses = yield* ephemeris.calculateHouses(
        julianDay,
        12.9716,
        77.5946,
        "WholeSign",
        "Lahiri",
      );

      expect(position.longitude).toBeGreaterThanOrEqual(0);
      expect(position.longitude).toBeLessThan(360);
      expect(houses.houseSystem).toBe("WholeSign");
      expect(houses.cusps).toHaveLength(13);
      expect(houses.ascendant).toBeGreaterThanOrEqual(0);
      expect(houses.ascendant).toBeLessThan(360);
    }).pipe(Effect.provide(Swisseph.layer)),
  );

  it.effect("maps native failures to EphemerisError", () =>
    Effect.gen(function* () {
      const ephemeris = yield* Effect.service(Ephemeris.Service);
      const error = yield* ephemeris.dateToJulianDay(new Date(Number.NaN)).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "EphemerisError",
        operation: "dateToJulianDay",
      });
    }).pipe(Effect.provide(Swisseph.layer)),
  );
});
