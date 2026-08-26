import * as Swisseph from "@swisseph/node";
import { DateTime, Effect, Semaphore } from "effect";
import type { DateTime as DateTimeType } from "effect/DateTime";

import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";
import { EphemerisError } from "../ephemeris/error.js";
import { type CelestialBody, JulianDay } from "../ephemeris/model.js";
import {
  normalizeAngle,
  siderealModeOf,
  celestialBodyOf,
  houseSystemOf,
  wholeSignCusps,
} from "./helper.js";

const NATIVE_SIDEREAL_MODE_LOCK = Semaphore.makeUnsafe(1);

export const dateToJulianDay = Effect.fn("Swisseph.dateToJulianDay")(function* (
  date: DateTimeType,
) {
  const julianDay = yield* Effect.try({
    try: () => Swisseph.dateToJulianDay(DateTime.toDate(date)),
    catch: (cause) => EphemerisError.make({ operation: "dateToJulianDay", cause }),
  });

  return JulianDay.make(julianDay);
});

export const calculatePosition = Effect.fn("Swisseph.calculatePosition")(function* (
  julianDay: number,
  body: CelestialBody,
  ayanamsa: typeof Ayanamsa.Type,
) {
  const mode = yield* siderealModeOf(ayanamsa);
  const cb = yield* celestialBodyOf(body);
  return yield* NATIVE_SIDEREAL_MODE_LOCK.withPermit(
    Effect.try({
      try: () => {
        Swisseph.setSiderealMode(mode);
        return Swisseph.calculatePosition(
          julianDay,
          cb,
          Swisseph.CalculationFlag.Sidereal | Swisseph.CalculationFlag.Speed,
        );
      },
      catch: (cause) => EphemerisError.make({ operation: "calculatePosition", cause }),
    }),
  );
});

export const calculateHouses = Effect.fn("Swisseph.calculateHouses")(function* (
  julianDay: number,
  latitude: number,
  longitude: number,
  houseSystem: typeof HouseSystem.Type,
  ayanamsa: typeof Ayanamsa.Type,
) {
  const mode = yield* siderealModeOf(ayanamsa);
  const nativeHouseSystem = yield* houseSystemOf(houseSystem);
  return yield* NATIVE_SIDEREAL_MODE_LOCK.withPermit(
    Effect.try({
      try: () => {
        Swisseph.setSiderealMode(mode);
        const houses = Swisseph.calculateHouses(julianDay, latitude, longitude, nativeHouseSystem);
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
      catch: (cause) => EphemerisError.make({ operation: "calculateHouses", cause }),
    }),
  );
});
