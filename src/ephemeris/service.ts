import { Context, Effect, Layer, Schema } from "effect";
import * as Swisseph from "@swisseph/node";
import { Ayanamsa, JulianDay } from "../types";

const SIDEREAL_MODE: Record<typeof Ayanamsa.Type, Swisseph.SiderealMode> = {
  Lahiri: Swisseph.SiderealMode.Lahiri,
  Raman: Swisseph.SiderealMode.Raman,
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

export class EphemerisError extends Schema.TaggedError<EphemerisError>()("EphemerisError", {
  operation: Schema.String,
  cause: Schema.Defect(),
}) {}

export class Ephemeris extends Context.Service<
  Ephemeris,
  {
    readonly dateToJulianDay: (date: Date) => Effect.Effect<JulianDay, EphemerisError>;
    readonly calculatePosition: (
      julianDay: JulianDay,
      body: Swisseph.CelestialBody,
      ayanamsa: typeof Ayanamsa.Type,
    ) => Effect.Effect<Swisseph.PlanetaryPosition, EphemerisError>;
    readonly calculateHouses: (
      julianDay: JulianDay,
      latitude: number,
      longitude: number,
      houseSystem: Swisseph.HouseSystem,
      ayanamsa: typeof Ayanamsa.Type,
    ) => Effect.Effect<Swisseph.HouseData, EphemerisError>;
  }
>()("@app/Ephemeris") {
  static readonly layer = Layer.succeed(
    Ephemeris,
    Ephemeris.of({
      dateToJulianDay: Effect.fn("Ephemeris.dateToJulianDay")(function* (date: Date) {
        const julianDay = yield* Effect.try({
          try: () => Swisseph.dateToJulianDay(date),
          catch: (cause) => new EphemerisError({ operation: "dateToJulianDay", cause }),
        });

        return JulianDay.make(julianDay);
      }),
      calculatePosition: Effect.fn("Ephemeris.calculatePosition")(function* (
        julianDay: JulianDay,
        body: Swisseph.CelestialBody,
        ayanamsa: typeof Ayanamsa.Type,
      ) {
        return yield* Effect.try({
          try: () => {
            Swisseph.setSiderealMode(SIDEREAL_MODE[ayanamsa]);
            return Swisseph.calculatePosition(
              julianDay,
              body,
              Swisseph.CalculationFlag.Sidereal | Swisseph.CalculationFlag.Speed,
            );
          },
          catch: (cause) => new EphemerisError({ operation: "calculatePosition", cause }),
        });
      }),
      calculateHouses: Effect.fn("Ephemeris.calculateHouses")(function* (
        julianDay: JulianDay,
        latitude: number,
        longitude: number,
        houseSystem: Swisseph.HouseSystem,
        ayanamsa: typeof Ayanamsa.Type,
      ) {
        return yield* Effect.try({
          try: () => {
            Swisseph.setSiderealMode(SIDEREAL_MODE[ayanamsa]);
            const houses = Swisseph.calculateHouses(julianDay, latitude, longitude, houseSystem);
            const offset = Swisseph.getAyanamsa(julianDay);
            const ascendant = normalizeAngle(houses.ascendant, offset);
            const cusps =
              houseSystem === Swisseph.HouseSystem.WholeSign
                ? wholeSignCusps(houses, ascendant)
                : houses.cusps.map((cusp) => normalizeAngle(cusp, offset));

            return {
              ...houses,
              cusps,
              ascendant,
              mc: normalizeAngle(houses.mc, offset),
              armc: normalizeAngle(houses.armc, offset),
              vertex: normalizeAngle(houses.vertex, offset),
              equatorialAscendant: normalizeAngle(houses.equatorialAscendant, offset),
              coAscendant1: normalizeAngle(houses.coAscendant1, offset),
              coAscendant2: normalizeAngle(houses.coAscendant2, offset),
              polarAscendant: normalizeAngle(houses.polarAscendant, offset),
            };
          },
          catch: (cause) => new EphemerisError({ operation: "calculateHouses", cause }),
        });
      }),
    }),
  );
}
