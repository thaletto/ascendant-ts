import * as Swisseph from "@swisseph/node";
import { Effect, Layer, Semaphore } from "effect";
import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";
import { EphemerisError } from "../ephemeris/error.js";
import { type CelestialBody, JulianDay } from "../ephemeris/model.js";
import { Service } from "../ephemeris/service.js";

const NATIVE_SIDEREAL_MODE_LOCK = Semaphore.makeUnsafe(1);

const SIDEREAL_MODE: Record<typeof Ayanamsa.Type, Swisseph.SiderealMode> = {
  FaganBradley: Swisseph.SiderealMode.FaganBradley,
  Lahiri: Swisseph.SiderealMode.Lahiri,
  DeLuce: Swisseph.SiderealMode.DeLuce,
  Raman: Swisseph.SiderealMode.Raman,
  Ushashashi: Swisseph.SiderealMode.Ushashashi,
  Krishnamurti: Swisseph.SiderealMode.Krishnamurti,
  DjwhalKhul: Swisseph.SiderealMode.DjwhalKhul,
  Yukteshwar: Swisseph.SiderealMode.Yukteshwar,
  JNBhasin: Swisseph.SiderealMode.JNBhasin,
  BabylKugler1: Swisseph.SiderealMode.BabylKugler1,
  BabylKugler2: Swisseph.SiderealMode.BabylKugler2,
  BabylKugler3: Swisseph.SiderealMode.BabylKugler3,
  BabylHuber: Swisseph.SiderealMode.BabylHuber,
  BabylEtPSC: Swisseph.SiderealMode.BabylEtPSC,
  Aldebaran15Tau: Swisseph.SiderealMode.Aldebaran15Tau,
  Hipparchos: Swisseph.SiderealMode.Hipparchos,
  Sassanian: Swisseph.SiderealMode.Sassanian,
  GalacticCenter0Sag: Swisseph.SiderealMode.GalacticCenter0Sag,
  J2000: Swisseph.SiderealMode.J2000,
  J1900: Swisseph.SiderealMode.J1900,
  B1950: Swisseph.SiderealMode.B1950,
  SuryaSiddhanta: Swisseph.SiderealMode.SuryaSiddhanta,
  SuryaSiddhantaMeanSun: Swisseph.SiderealMode.SuryaSiddhantaMeanSun,
  Aryabhata: Swisseph.SiderealMode.Aryabhata,
  AryabhataMeanSun: Swisseph.SiderealMode.AryabhataMeanSun,
  SSRevati: Swisseph.SiderealMode.SSRevati,
  SSCitra: Swisseph.SiderealMode.SSCitra,
  TrueCitra: Swisseph.SiderealMode.TrueCitra,
  TrueRevati: Swisseph.SiderealMode.TrueRevati,
  TruePushya: Swisseph.SiderealMode.TruePushya,
  GalacticCenterGilBrand: Swisseph.SiderealMode.GalacticCenterGilBrand,
  GalacticEquatorIAU1958: Swisseph.SiderealMode.GalacticEquatorIAU1958,
  GalacticEquator: Swisseph.SiderealMode.GalacticEquator,
  GalacticEquatorMidMula: Swisseph.SiderealMode.GalacticEquatorMidMula,
  Skydram: Swisseph.SiderealMode.Skydram,
  TrueMula: Swisseph.SiderealMode.TrueMula,
  DhruvaGalCenterMulaWilhelm: Swisseph.SiderealMode.DhruvaGalCenterMulaWilhelm,
  Aryabhata522: Swisseph.SiderealMode.Aryabhata522,
  BabylBritton: Swisseph.SiderealMode.BabylBritton,
};

const CELESTIAL_BODY: Record<CelestialBody, Swisseph.CelestialBody> = {
  Sun: Swisseph.Planet.Sun,
  Moon: Swisseph.Planet.Moon,
  Mars: Swisseph.Planet.Mars,
  Mercury: Swisseph.Planet.Mercury,
  Venus: Swisseph.Planet.Venus,
  Jupiter: Swisseph.Planet.Jupiter,
  Saturn: Swisseph.Planet.Saturn,
  TrueNode: Swisseph.LunarPoint.TrueNode,
};

const HOUSE_SYSTEM: Record<typeof HouseSystem.Type, Swisseph.HouseSystem> = {
  Placidus: Swisseph.HouseSystem.Placidus,
  Koch: Swisseph.HouseSystem.Koch,
  Porphyrius: Swisseph.HouseSystem.Porphyrius,
  Regiomontanus: Swisseph.HouseSystem.Regiomontanus,
  Campanus: Swisseph.HouseSystem.Campanus,
  Equal: Swisseph.HouseSystem.Equal,
  VehlowEqual: Swisseph.HouseSystem.VehlowEqual,
  WholeSign: Swisseph.HouseSystem.WholeSign,
  Meridian: Swisseph.HouseSystem.Meridian,
  Azimuthal: Swisseph.HouseSystem.Azimuthal,
  PolichPage: Swisseph.HouseSystem.PolichPage,
  Alcabitus: Swisseph.HouseSystem.Alcabitus,
  Morinus: Swisseph.HouseSystem.Morinus,
};

function normalizeAngle(angle: number, offset: number): number {
  return (((angle - offset) % 360) + 360) % 360;
}

function wholeSignCusps(houses: Swisseph.HouseData, ascendant: number): number[] {
  return Array.from({ length: 13 }, (_, index) => {
    if (index === 0) return houses.cusps[0] ?? 0;
    const firstCusp = Math.floor(ascendant / 30) * 30;
    return (firstCusp + (index - 1) * 30) % 360;
  });
}

export const layer = Layer.succeed(
  Service,
  Service.of({
    dateToJulianDay: Effect.fn("Swisseph.dateToJulianDay")(function* (date: Date) {
      const julianDay = yield* Effect.try({
        try: () => Swisseph.dateToJulianDay(date),
        catch: (cause) => new EphemerisError({ operation: "dateToJulianDay", cause }),
      });

      return JulianDay.make(julianDay);
    }),
    calculatePosition: Effect.fn("Swisseph.calculatePosition")(
      function* (julianDay, body, ayanamsa) {
        return yield* NATIVE_SIDEREAL_MODE_LOCK.withPermit(
          Effect.try({
            try: () => {
              Swisseph.setSiderealMode(SIDEREAL_MODE[ayanamsa]);
              return Swisseph.calculatePosition(
                julianDay,
                CELESTIAL_BODY[body],
                Swisseph.CalculationFlag.Sidereal | Swisseph.CalculationFlag.Speed,
              );
            },
            catch: (cause) => new EphemerisError({ operation: "calculatePosition", cause }),
          }),
        );
      },
    ),
    calculateHouses: Effect.fn("Swisseph.calculateHouses")(
      function* (julianDay, latitude, longitude, houseSystem, ayanamsa) {
        return yield* NATIVE_SIDEREAL_MODE_LOCK.withPermit(
          Effect.try({
            try: () => {
              Swisseph.setSiderealMode(SIDEREAL_MODE[ayanamsa]);
              const nativeHouseSystem = HOUSE_SYSTEM[houseSystem];
              const houses = Swisseph.calculateHouses(
                julianDay,
                latitude,
                longitude,
                nativeHouseSystem,
              );
              const offset = Swisseph.getAyanamsa(julianDay);
              const ascendant = normalizeAngle(houses.ascendant, offset);
              const cusps =
                houseSystem === "WholeSign"
                  ? wholeSignCusps(houses, ascendant)
                  : houses.cusps.map((cusp) => normalizeAngle(cusp, offset));

              return {
                cusps,
                ascendant,
                mc: normalizeAngle(houses.mc, offset),
                armc: normalizeAngle(houses.armc, 0),
                vertex: normalizeAngle(houses.vertex, offset),
                equatorialAscendant: normalizeAngle(houses.equatorialAscendant, offset),
                coAscendant1: normalizeAngle(houses.coAscendant1, offset),
                coAscendant2: normalizeAngle(houses.coAscendant2, offset),
                polarAscendant: normalizeAngle(houses.polarAscendant, offset),
                houseSystem,
              };
            },
            catch: (cause) => new EphemerisError({ operation: "calculateHouses", cause }),
          }),
        );
      },
    ),
  }),
);
