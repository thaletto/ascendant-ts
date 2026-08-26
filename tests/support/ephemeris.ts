import { Effect, Layer } from "effect";
import type { DateTime } from "effect/DateTime";

import { Ayanamsa, HouseSystem } from "../../src/astro-params/model.js";
import {
  CelestialBody,
  type HouseData,
  JulianDay,
  type PlanetaryPosition,
} from "../../src/ephemeris/model.js";
import { Ephemeris } from "../../src/ephemeris/service.js";

function positionAt(body: CelestialBody): PlanetaryPosition {
  const longitude = CelestialBody.literals.indexOf(body) * 30;

  return {
    longitude,
    latitude: 0,
    distance: 1,
    longitudeSpeed: 1,
    latitudeSpeed: 0,
    distanceSpeed: 0,
    flags: 0,
  };
}

function dateToJulianDay(_date: DateTime) {
  return Effect.succeed(JulianDay.make(2_451_545));
}

function calculatePosition(
  _julianDay: JulianDay,
  body: CelestialBody,
  _ayanamsa: typeof Ayanamsa.Type,
) {
  return Effect.succeed(positionAt(body));
}

function calculateHouses(
  _julianDay: JulianDay,
  _latitude: number,
  _longitude: number,
  houseSystem: typeof HouseSystem.Type,
  _ayanamsa: typeof Ayanamsa.Type,
) {
  return Effect.succeed({
    cusps: [0, 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
    ascendant: 0,
    mc: 270,
    armc: 270,
    vertex: 90,
    equatorialAscendant: 0,
    coAscendant1: 0,
    coAscendant2: 0,
    polarAscendant: 0,
    houseSystem,
  } satisfies HouseData);
}

export const EphemerisTestLayer = Layer.succeed(
  Ephemeris,
  Ephemeris.of({
    dateToJulianDay,
    calculatePosition,
    calculateHouses,
  }),
);
