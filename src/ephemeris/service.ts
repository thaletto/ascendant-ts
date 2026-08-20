import { Context, Effect, Layer, Schema } from "effect";
import * as Swisseph from "@swisseph/node";
import { Ayanamsa, JulianDay } from "../types";

const SIDEREAL_MODE: Record<typeof Ayanamsa.Type, Swisseph.SiderealMode> = {
  Lahiri: Swisseph.SiderealMode.Lahiri,
  Raman: Swisseph.SiderealMode.Raman,
};

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
  static readonly layer = Layer.effect(
    Ephemeris,
    Effect.sync(() => {
      const dateToJulianDay = Effect.fn("Ephemeris.dateToJulianDay")((date: Date) =>
        Effect.try({
          try: () => Swisseph.dateToJulianDay(date),
          catch: (cause) => new EphemerisError({ operation: "dateToJulianDay", cause }),
        }).pipe(Effect.map((julianDay) => JulianDay.make(julianDay))),
      );

      const calculatePosition = Effect.fn("Ephemeris.calculatePosition")(
        (julianDay: JulianDay, body: Swisseph.CelestialBody, ayanamsa: typeof Ayanamsa.Type) =>
          Effect.try({
            try: () => {
              Swisseph.setSiderealMode(SIDEREAL_MODE[ayanamsa]);
              return Swisseph.calculatePosition(
                julianDay,
                body,
                Swisseph.CalculationFlag.Sidereal | Swisseph.CalculationFlag.Speed,
              );
            },
            catch: (cause) => new EphemerisError({ operation: "calculatePosition", cause }),
          }),
      );

      const calculateHouses = Effect.fn("Ephemeris.calculateHouses")(
        (
          julianDay: JulianDay,
          latitude: number,
          longitude: number,
          houseSystem: Swisseph.HouseSystem,
          ayanamsa: typeof Ayanamsa.Type,
        ) =>
          Effect.try({
            try: () => {
              Swisseph.setSiderealMode(SIDEREAL_MODE[ayanamsa]);
              const houses = Swisseph.calculateHouses(julianDay, latitude, longitude, houseSystem);
              const ayanamsaOffset = Swisseph.getAyanamsa(julianDay);
              const ascendant = (((houses.ascendant - ayanamsaOffset) % 360) + 360) % 360;
              const cusps =
                houseSystem === Swisseph.HouseSystem.WholeSign
                  ? Array.from({ length: 13 }, (_, i) => {
                      if (i === 0) return houses.cusps[0] ?? 0;
                      const start = Math.floor(ascendant / 30) * 30;
                      return (((start + (i - 1) * 30) % 360) + 360) % 360;
                    })
                  : houses.cusps.map((cusp) => (((cusp - ayanamsaOffset) % 360) + 360) % 360);
              return {
                ...houses,
                cusps,
                ascendant,
                mc: (((houses.mc - ayanamsaOffset) % 360) + 360) % 360,
                armc: (((houses.armc - ayanamsaOffset) % 360) + 360) % 360,
                vertex: (((houses.vertex - ayanamsaOffset) % 360) + 360) % 360,
                equatorialAscendant:
                  (((houses.equatorialAscendant - ayanamsaOffset) % 360) + 360) % 360,
                coAscendant1: (((houses.coAscendant1 - ayanamsaOffset) % 360) + 360) % 360,
                coAscendant2: (((houses.coAscendant2 - ayanamsaOffset) % 360) + 360) % 360,
                polarAscendant: (((houses.polarAscendant - ayanamsaOffset) % 360) + 360) % 360,
              };
            },
            catch: (cause) => new EphemerisError({ operation: "calculateHouses", cause }),
          }),
      );

      return Ephemeris.of({
        dateToJulianDay,
        calculatePosition,
        calculateHouses,
      });
    }),
  );
}
