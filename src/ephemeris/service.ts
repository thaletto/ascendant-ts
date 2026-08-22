import { Context, Effect } from "effect";
import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";
import { EphemerisError } from "./error.js";
import {
  type CelestialBody,
  type HouseData,
  type JulianDay,
  type PlanetaryPosition,
} from "./model.js";

export class Service extends Context.Service<
  Service,
  {
    readonly dateToJulianDay: (date: Date) => Effect.Effect<JulianDay, EphemerisError>;
    readonly calculatePosition: (
      julianDay: JulianDay,
      body: CelestialBody,
      ayanamsa: typeof Ayanamsa.Type,
    ) => Effect.Effect<PlanetaryPosition, EphemerisError>;
    readonly calculateHouses: (
      julianDay: JulianDay,
      latitude: number,
      longitude: number,
      houseSystem: typeof HouseSystem.Type,
      ayanamsa: typeof Ayanamsa.Type,
    ) => Effect.Effect<HouseData, EphemerisError>;
  }
>()("astro-ascendant/ephemeris/Service") {}
