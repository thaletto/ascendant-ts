import * as Swisseph from "@swisseph/node";
import { DateTime, Effect, Semaphore } from "effect";
import type { DateTime as DateTimeType } from "effect/DateTime";

import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";
import { EphemerisError } from "../ephemeris/error.js";
import { type CelestialBody, JulianDay } from "../ephemeris/model.js";
import { normalizeLongitude } from "../utils/position.js";
import { siderealModeOf, celestialBodyOf, houseSystemOf, wholeSignCusps } from "./helper.js";

const NATIVE_SIDEREAL_MODE_LOCK = Semaphore.makeUnsafe(1);

export const dateToJulianDay = Effect.fn("astro-ascendant/swisseph/dateToJulianDay")(function* (
  date: DateTimeType,
) {
  const julianDay = yield* Effect.try({
    try: () => Swisseph.dateToJulianDay(DateTime.toDate(date)),
    catch: (cause) => EphemerisError.make({ operation: "dateToJulianDay", cause }),
  });

  return JulianDay.make(julianDay);
});

export const calculatePosition = Effect.fn("astro-ascendant/swisseph/calculatePosition")(function* (
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

export const calculateHouses = Effect.fn("astro-ascendant/swisseph/calculateHouses")(function* (
  julianDay: number,
  latitude: number,
  longitude: number,
  houseSystem: typeof HouseSystem.Type,
  ayanamsa: typeof Ayanamsa.Type,
) {
  const mode = yield* siderealModeOf(ayanamsa);
  const nativeHouseSystem = yield* houseSystemOf(houseSystem);
  const { houses, offset } = yield* NATIVE_SIDEREAL_MODE_LOCK.withPermit(
    Effect.try({
      try: () => {
        Swisseph.setSiderealMode(mode);
        return {
          houses: Swisseph.calculateHouses(julianDay, latitude, longitude, nativeHouseSystem),
          offset: Swisseph.getAyanamsa(julianDay),
        };
      },
      catch: (cause) => EphemerisError.make({ operation: "calculateHouses", cause }),
    }),
  );
  return yield* Effect.gen(function* () {
    const ascendant = yield* normalizeLongitude(houses.ascendant - offset);
    const cusps =
      houseSystem === "WholeSign"
        ? yield* wholeSignCusps(houses, ascendant)
        : yield* Effect.forEach(houses.cusps, (cusp) => normalizeLongitude(cusp - offset));

    return {
      cusps,
      ascendant,
      mc: yield* normalizeLongitude(houses.mc - offset),
      armc: yield* normalizeLongitude(houses.armc),
      vertex: yield* normalizeLongitude(houses.vertex - offset),
      equatorialAscendant: yield* normalizeLongitude(houses.equatorialAscendant - offset),
      coAscendant1: yield* normalizeLongitude(houses.coAscendant1 - offset),
      coAscendant2: yield* normalizeLongitude(houses.coAscendant2 - offset),
      polarAscendant: yield* normalizeLongitude(houses.polarAscendant - offset),
      houseSystem,
    };
  }).pipe(Effect.mapError((cause) => EphemerisError.make({ operation: "calculateHouses", cause })));
});
