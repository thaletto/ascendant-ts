/**
 * Validated coordinate parsing: the fallible `Effect` half of the conversion
 * hub. Raw angles enter here and leave as branded coordinates; total lookups
 * live in `./zodiac.js`.
 */
import { Data, Effect } from "effect";

import type { Planets, Rashis } from "../chart/model.js";
import { Longitude } from "../chart/model.js";
import type { CelestialBody } from "../ephemeris/model.js";
import { indexOfLongitude, rashiIndexOf, wrapIndex } from "./zodiac.js";

export const EPS_CIRCLE = 1e-7;
export const EPS_BOUNDARY = 1e-9;
export const EPS_PART = 1e-12;

const PLANET_BODY: Record<Planets, CelestialBody> = {
  Sun: "Sun",
  Moon: "Moon",
  Mars: "Mars",
  Mercury: "Mercury",
  Venus: "Venus",
  Jupiter: "Jupiter",
  Saturn: "Saturn",
  Rahu: "MeanNode",
  Ketu: "MeanNode",
};

export class LongitudeError extends Data.TaggedError("LongitudeError")<{
  readonly message: string;
  readonly longitude: number;
}> {}

export class SignIndexError extends Data.TaggedError("SignIndexError")<{
  readonly message: string;
  readonly index: number;
}> {}

/** Ephemeris body backing a planet (nodes share the mean node). */
export const planetBodyOf = (planet: Planets) => Effect.succeed(PLANET_BODY[planet]);

// Converts an angle into branded Longitude in the range of [0, 360)
export const normalizeLongitude = Effect.fn(function* (longitude: number) {
  if (!Number.isFinite(longitude)) {
    return yield* new LongitudeError({
      message: "Longitude must be finite",
      longitude,
    });
  }

  const normalized = ((longitude % 360) + 360) % 360;

  if (normalized < 0 || normalized >= 360) {
    return yield* new LongitudeError({
      message: `Normalized longitude ${normalized} is outside [0, 360)`,
      longitude,
    });
  }

  return Longitude.make(normalized);
});

// Converts an angle into the signed range [-180, 180)
export const wrap180 = Effect.fn(function* (degrees: number) {
  return (yield* normalizeLongitude(degrees + 180)) - 180;
});

/** 0-based wheel position of the sign containing a longitude. */
export const signIndexOf = Effect.fn(function* (longitude: Longitude) {
  const normalized = yield* normalizeLongitude(longitude);
  return indexOfLongitude(normalized);
});

/** Wraps any integer onto the 0–11 sign wheel, rejecting non-integers. */
export const signAtIndex = Effect.fn(function* (index: number) {
  if (!Number.isFinite(index)) {
    return yield* new SignIndexError({
      message: "Sign index must be finite",
      index,
    });
  }

  if (!Number.isInteger(index)) {
    return yield* new SignIndexError({
      message: "Sign index must be an integer",
      index,
    });
  }

  return wrapIndex(index);
});

/** 0-based wheel position of a sign. */
export const indexOfSign = (sign: Rashis) => Effect.succeed(rashiIndexOf(sign));

// Returns the start longitude (0, 30, ..., 330) of the zodiac sign containing the given longitude
export const signStartOf = Effect.fn(function* (longitude: number) {
  const normalized = yield* normalizeLongitude(longitude);
  return (Math.floor(normalized / 30) * 30) as Longitude;
});

/** Ketu sits exactly opposite Rahu. */
export const ketuFromRahu = Effect.fn(function* (rahuLongitude: number) {
  return yield* normalizeLongitude(rahuLongitude + 180);
});
