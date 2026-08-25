import { Context, Effect, Layer } from "effect";
import type { DateTime } from "effect/DateTime";

import { type Ayanamsa, type HouseSystem } from "../astro-params/model.js";
import { EphemerisError } from "../ephemeris/error.js";
import { type CelestialBody, JulianDay } from "../ephemeris/model.js";
import { dateToJulianDay, calculatePosition, calculateHouses } from "./calculate.js";

class SwissephService extends Context.Service<
  SwissephService,
  {
    readonly dateToJulianDay: (date: DateTime) => Effect.Effect<JulianDay, EphemerisError>;
    readonly calculatePosition: (
      julianDay: number,
      body: CelestialBody,
      ayanamsa: typeof Ayanamsa.Type,
    ) => Effect.Effect<unknown, EphemerisError>;
    readonly calculateHouses: (
      julianDay: number,
      latitude: number,
      longitude: number,
      houseSystem: typeof HouseSystem.Type,
      ayanamsa: typeof Ayanamsa.Type,
    ) => Effect.Effect<unknown, EphemerisError>;
  }
>()("astro-ascendant/swisseph/service/SwissephService") {}

const layer = Layer.succeed(
  SwissephService,
  SwissephService.of({
    dateToJulianDay,
    calculatePosition,
    calculateHouses,
  }),
);

export { layer as SwissephLayer };
