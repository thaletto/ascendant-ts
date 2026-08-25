import { describe, expect, it } from "@effect/vitest";
import * as NativeSwisseph from "@swisseph/node";
import { Effect } from "effect";

import * as AstroParams from "../src/astro-params/index.js";
import * as Ephemeris from "../src/ephemeris/index.js";
import * as Swisseph from "../src/swisseph/index.js";

const AYANAMSA_MAPPING = [
  ["FaganBradley", NativeSwisseph.SiderealMode.FaganBradley],
  ["Lahiri", NativeSwisseph.SiderealMode.Lahiri],
  ["DeLuce", NativeSwisseph.SiderealMode.DeLuce],
  ["Raman", NativeSwisseph.SiderealMode.Raman],
  ["Ushashashi", NativeSwisseph.SiderealMode.Ushashashi],
  ["Krishnamurti", NativeSwisseph.SiderealMode.Krishnamurti],
  ["DjwhalKhul", NativeSwisseph.SiderealMode.DjwhalKhul],
  ["Yukteshwar", NativeSwisseph.SiderealMode.Yukteshwar],
  ["JNBhasin", NativeSwisseph.SiderealMode.JNBhasin],
  ["BabylKugler1", NativeSwisseph.SiderealMode.BabylKugler1],
  ["BabylKugler2", NativeSwisseph.SiderealMode.BabylKugler2],
  ["BabylKugler3", NativeSwisseph.SiderealMode.BabylKugler3],
  ["BabylHuber", NativeSwisseph.SiderealMode.BabylHuber],
  ["BabylEtPSC", NativeSwisseph.SiderealMode.BabylEtPSC],
  ["Aldebaran15Tau", NativeSwisseph.SiderealMode.Aldebaran15Tau],
  ["Hipparchos", NativeSwisseph.SiderealMode.Hipparchos],
  ["Sassanian", NativeSwisseph.SiderealMode.Sassanian],
  ["GalacticCenter0Sag", NativeSwisseph.SiderealMode.GalacticCenter0Sag],
  ["J2000", NativeSwisseph.SiderealMode.J2000],
  ["J1900", NativeSwisseph.SiderealMode.J1900],
  ["B1950", NativeSwisseph.SiderealMode.B1950],
  ["SuryaSiddhanta", NativeSwisseph.SiderealMode.SuryaSiddhanta],
  ["SuryaSiddhantaMeanSun", NativeSwisseph.SiderealMode.SuryaSiddhantaMeanSun],
  ["Aryabhata", NativeSwisseph.SiderealMode.Aryabhata],
  ["AryabhataMeanSun", NativeSwisseph.SiderealMode.AryabhataMeanSun],
  ["SSRevati", NativeSwisseph.SiderealMode.SSRevati],
  ["SSCitra", NativeSwisseph.SiderealMode.SSCitra],
  ["TrueCitra", NativeSwisseph.SiderealMode.TrueCitra],
  ["TrueRevati", NativeSwisseph.SiderealMode.TrueRevati],
  ["TruePushya", NativeSwisseph.SiderealMode.TruePushya],
  ["GalacticCenterGilBrand", NativeSwisseph.SiderealMode.GalacticCenterGilBrand],
  ["GalacticEquatorIAU1958", NativeSwisseph.SiderealMode.GalacticEquatorIAU1958],
  ["GalacticEquator", NativeSwisseph.SiderealMode.GalacticEquator],
  ["GalacticEquatorMidMula", NativeSwisseph.SiderealMode.GalacticEquatorMidMula],
  ["Skydram", NativeSwisseph.SiderealMode.Skydram],
  ["TrueMula", NativeSwisseph.SiderealMode.TrueMula],
  ["DhruvaGalCenterMulaWilhelm", NativeSwisseph.SiderealMode.DhruvaGalCenterMulaWilhelm],
  ["Aryabhata522", NativeSwisseph.SiderealMode.Aryabhata522],
  ["BabylBritton", NativeSwisseph.SiderealMode.BabylBritton],
] as const satisfies ReadonlyArray<
  readonly [typeof AstroParams.Ayanamsa.Type, NativeSwisseph.SiderealMode]
>;

const HOUSE_SYSTEM_MAPPING = [
  ["Placidus", NativeSwisseph.HouseSystem.Placidus],
  ["Koch", NativeSwisseph.HouseSystem.Koch],
  ["Porphyrius", NativeSwisseph.HouseSystem.Porphyrius],
  ["Regiomontanus", NativeSwisseph.HouseSystem.Regiomontanus],
  ["Campanus", NativeSwisseph.HouseSystem.Campanus],
  ["Equal", NativeSwisseph.HouseSystem.Equal],
  ["VehlowEqual", NativeSwisseph.HouseSystem.VehlowEqual],
  ["WholeSign", NativeSwisseph.HouseSystem.WholeSign],
  ["Meridian", NativeSwisseph.HouseSystem.Meridian],
  ["Azimuthal", NativeSwisseph.HouseSystem.Azimuthal],
  ["PolichPage", NativeSwisseph.HouseSystem.PolichPage],
  ["Alcabitus", NativeSwisseph.HouseSystem.Alcabitus],
  ["Morinus", NativeSwisseph.HouseSystem.Morinus],
] as const satisfies ReadonlyArray<
  readonly [typeof AstroParams.HouseSystem.Type, NativeSwisseph.HouseSystem]
>;

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

describe("Swiss Ephemeris adapter", () => {
  it.effect("maps every public ayanamsa and house system to its exact native enum", () =>
    Effect.gen(function* () {
      const ephemeris = yield* Effect.service(Ephemeris.Service);
      const julianDay = yield* ephemeris.dateToJulianDay(new Date("2000-01-01T12:00:00.000Z"));

      for (const [ayanamsa, nativeMode] of AYANAMSA_MAPPING) {
        NativeSwisseph.setSiderealMode(nativeMode);
        const expected = NativeSwisseph.calculatePosition(
          julianDay,
          NativeSwisseph.Planet.Sun,
          NativeSwisseph.CalculationFlag.Sidereal | NativeSwisseph.CalculationFlag.Speed,
        );
        const actual = yield* ephemeris.calculatePosition(julianDay, "Sun", ayanamsa);
        expect(actual.longitude).toBeCloseTo(expected.longitude, 10);
      }

      NativeSwisseph.setSiderealMode(NativeSwisseph.SiderealMode.Lahiri);
      const offset = NativeSwisseph.getAyanamsa(julianDay);
      for (const [houseSystem, nativeSystem] of HOUSE_SYSTEM_MAPPING) {
        const native = NativeSwisseph.calculateHouses(julianDay, 12.9716, 77.5946, nativeSystem);
        const actual = yield* ephemeris.calculateHouses(
          julianDay,
          12.9716,
          77.5946,
          houseSystem,
          "Lahiri",
        );
        const ascendant = normalizeAngle(native.ascendant - offset);
        const expectedCusps =
          houseSystem === "WholeSign"
            ? Array.from({ length: 13 }, (_, index) =>
                index === 0
                  ? (native.cusps[0] ?? 0)
                  : (Math.floor(ascendant / 30) * 30 + (index - 1) * 30) % 360,
              )
            : native.cusps.map((cusp) => normalizeAngle(cusp - offset));

        expect(actual.cusps).toEqual(expectedCusps);
      }
    }).pipe(Effect.provide(Swisseph.layer)),
  );

  it.effect("isolates concurrent calculations that use different ayanamsas", () =>
    Effect.gen(function* () {
      const ephemeris = yield* Effect.service(Ephemeris.Service);
      const julianDay = yield* ephemeris.dateToJulianDay(new Date("2000-01-01T12:00:00.000Z"));
      const ayanamsas = ["FaganBradley", "Lahiri", "Raman", "J2000"] as const;
      const expected = yield* Effect.all(
        ayanamsas.map((ayanamsa) => ephemeris.calculatePosition(julianDay, "Sun", ayanamsa)),
        { concurrency: 1 },
      );
      const requests = Array.from({ length: 10 }, () => ayanamsas).flat();
      const concurrent = yield* Effect.all(
        requests.map((ayanamsa) => ephemeris.calculatePosition(julianDay, "Sun", ayanamsa)),
        { concurrency: "unbounded" },
      );

      for (const [index, position] of concurrent.entries()) {
        const expectedPosition = expected[index % ayanamsas.length];
        expect(expectedPosition).toBeDefined();
        if (expectedPosition !== undefined) {
          expect(position.longitude).toBeCloseTo(expectedPosition.longitude, 10);
        }
      }
    }).pipe(Effect.provide(Swisseph.layer)),
  );

  it.effect("keeps ARMC unshifted when converting tropical houses to sidereal", () =>
    Effect.gen(function* () {
      const ephemeris = yield* Effect.service(Ephemeris.Service);
      const julianDay = yield* ephemeris.dateToJulianDay(new Date("2000-01-01T12:00:00.000Z"));
      const native = NativeSwisseph.calculateHouses(
        julianDay,
        12.9716,
        77.5946,
        NativeSwisseph.HouseSystem.Placidus,
      );
      const sidereal = yield* ephemeris.calculateHouses(
        julianDay,
        12.9716,
        77.5946,
        "Placidus",
        "Lahiri",
      );

      expect(sidereal.armc).toBeCloseTo(native.armc, 10);
      expect(sidereal.mc).not.toBeCloseTo(native.mc, 5);
    }).pipe(Effect.provide(Swisseph.layer)),
  );

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

  it.effect("returns a typed failure when the requested house system is unavailable", () =>
    Effect.gen(function* () {
      const ephemeris = yield* Effect.service(Ephemeris.Service);
      const julianDay = yield* ephemeris.dateToJulianDay(new Date("2000-01-01T12:00:00.000Z"));
      const error = yield* ephemeris
        .calculateHouses(julianDay, 80, 0, "Placidus", "Lahiri")
        .pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "EphemerisError",
        operation: "calculateHouses",
      });
    }).pipe(Effect.provide(Swisseph.layer)),
  );
});
