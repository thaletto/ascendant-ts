import { Schema } from "effect";
import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";

export const JulianDay = Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1e7 })).pipe(
  Schema.brand("JulianDay"),
);

export type JulianDay = typeof JulianDay.Type;

export const CelestialBody = Schema.Literals([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Venus",
  "Jupiter",
  "Saturn",
  "TrueNode",
]);

export type CelestialBody = typeof CelestialBody.Type;

export interface PlanetaryPosition {
  readonly longitude: number;
  readonly latitude: number;
  readonly distance: number;
  readonly longitudeSpeed: number;
  readonly latitudeSpeed: number;
  readonly distanceSpeed: number;
  readonly flags: number;
}

export interface HouseData {
  readonly cusps: readonly number[];
  readonly ascendant: number;
  readonly mc: number;
  readonly armc: number;
  readonly vertex: number;
  readonly equatorialAscendant: number;
  readonly coAscendant1: number;
  readonly coAscendant2: number;
  readonly polarAscendant: number;
  readonly houseSystem: typeof HouseSystem.Type;
}

export interface PositionRequest {
  readonly julianDay: JulianDay;
  readonly body: CelestialBody;
  readonly ayanamsa: typeof Ayanamsa.Type;
}
