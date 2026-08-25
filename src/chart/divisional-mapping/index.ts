import { Effect, pipe } from "effect";

import { type Division, Longitude } from "../../internal/model.js";
import { DivisionalMappingError } from "./error.js";
import {
  divisionalTargetOf,
  identityTargetOf,
  sourcePositionOf,
  subdivisionOf,
  targetSignOf,
} from "./helper.js";

export const DIVISIONAL_MAPPING = "ascendant-divisional-mapping" as const;

export const normalizeLongitude = Effect.fn("Chart.DivisionalMapping.normalizeLongitude")(
  function* (longitude: number) {
    if (!Number.isFinite(longitude)) {
      return yield* DivisionalMappingError.make({
        message: "Longitude must be finite",
        cause: longitude,
      });
    }

    return pipe(
      longitude % 360,
      (remainder) => (remainder < 0 ? remainder + 360 : remainder),
      (normalized) => Longitude.make(normalized),
    );
  },
);

export const getDivisionalTarget = Effect.fn("Chart.DivisionalMapping.getDivisionalTarget")(
  function* (longitude: number, division: Division) {
    const source = yield* normalizeLongitude(longitude).pipe(Effect.map(sourcePositionOf));

    if (division === 1) {
      return pipe(source, identityTargetOf);
    }

    const subdivision = subdivisionOf(source.degree, division);
    const signIndex = targetSignOf(source, subdivision, division);

    return pipe({ signIndex, degree: subdivision.degree }, divisionalTargetOf);
  },
);
