import * as Swisseph from "@swisseph/node";
import { Effect, Layer } from "effect";
import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";
import { EphemerisError } from "../ephemeris/error.js";
import { type CelestialBody, JulianDay } from "../ephemeris/model.js";
import { Service } from "../ephemeris/service.js";

const SIDEREAL_MODE: Record<typeof Ayanamsa.Type, Swisseph.SiderealMode> = {
  Lahiri: Swisseph.SiderealMode.Lahiri,
  Raman: Swisseph.SiderealMode.Raman,
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
  WholeSign: Swisseph.HouseSystem.WholeSign,
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
        return yield* Effect.try({
          try: () => {
            Swisseph.setSiderealMode(SIDEREAL_MODE[ayanamsa]);
            return Swisseph.calculatePosition(
              julianDay,
              CELESTIAL_BODY[body],
              Swisseph.CalculationFlag.Sidereal | Swisseph.CalculationFlag.Speed,
            );
          },
          catch: (cause) => new EphemerisError({ operation: "calculatePosition", cause }),
        });
      },
    ),
    calculateHouses: Effect.fn("Swisseph.calculateHouses")(
      function* (julianDay, latitude, longitude, houseSystem, ayanamsa) {
        return yield* Effect.try({
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
              armc: normalizeAngle(houses.armc, offset),
              vertex: normalizeAngle(houses.vertex, offset),
              equatorialAscendant: normalizeAngle(houses.equatorialAscendant, offset),
              coAscendant1: normalizeAngle(houses.coAscendant1, offset),
              coAscendant2: normalizeAngle(houses.coAscendant2, offset),
              polarAscendant: normalizeAngle(houses.polarAscendant, offset),
              houseSystem,
            };
          },
          catch: (cause) => new EphemerisError({ operation: "calculateHouses", cause }),
        });
      },
    ),
  }),
);
