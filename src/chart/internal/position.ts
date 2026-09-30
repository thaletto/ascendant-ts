import { Array, Effect, DateTime } from "effect";
import type { DateTime as DateTimeType } from "effect/DateTime";

import { Zodiac } from "../../utils/index.js";
import { signIndexOf } from "../../utils/position.js";
import type { Longitude, Rashis } from "../model.js";
import { CLASSICAL_PLANETS, RASHIS, SIGN_LORDS } from "./constants.js";

/** Returns true if the sign is movable (Aries, Cancer, Libra, Capricorn). */
export const isMovableSign = (sign: Rashis) => Effect.succeed(Zodiac.rashiIndexOf(sign) % 3 === 0);

/** Returns true if the sign is fixed (Taurus, Leo, Scorpio, Aquarius). */
export const isFixedSign = (sign: Rashis) => Effect.succeed(Zodiac.rashiIndexOf(sign) % 3 === 1);

/** Returns true if the sign is dual (Gemini, Virgo, Sagittarius, Pisces). */
export const isDualSign = (sign: Rashis) => Effect.succeed(Zodiac.rashiIndexOf(sign) % 3 === 2);

export const signAt = Effect.fn(function* (longitude: Longitude) {
  const index = yield* signIndexOf(longitude);
  return Array.getUnsafe(RASHIS, index);
});

export const signLordOf = Effect.fn(function* (longitude: Longitude) {
  const sign = yield* signAt(longitude);
  return SIGN_LORDS[sign];
});

export const dayLord = (date: DateTimeType) =>
  Effect.succeed(CLASSICAL_PLANETS[DateTime.toDate(date).getUTCDay()]!);
