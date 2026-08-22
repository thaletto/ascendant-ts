import { Effect, pipe, Schema } from "effect";
import { Degree, Division, Longitude } from "./model.js";

export const DIVISIONAL_MAPPING = "ascendant-divisional-mapping" as const;

export class DivisionalMappingError extends Schema.TaggedError<DivisionalMappingError>()(
  "DivisionalMappingError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}

export interface DivisionalTarget {
  readonly signIndex: number;
  readonly degree: Degree;
  readonly longitude: Longitude;
}

interface SourcePosition {
  readonly longitude: Longitude;
  readonly signIndex: number;
  readonly degree: number;
}

interface Subdivision {
  readonly partIndex: number;
  readonly degree: number;
}

const sourcePositionOf = (longitude: Longitude): SourcePosition => ({
  longitude,
  signIndex: Math.floor(longitude / 30),
  degree: longitude % 30,
});

const subdivisionOf = (degree: number, division: typeof Division.Type): Subdivision => {
  const partSize = 30 / division;
  const scaledPart = degree / partSize;
  const nearestPart = Math.round(scaledPart);
  const partPosition =
    nearestPart < division && Math.abs(scaledPart - nearestPart) < 1e-12 ? nearestPart : scaledPart;
  const partIndex = Math.min(division - 1, Math.floor(partPosition));

  return {
    partIndex,
    degree: (partPosition - partIndex) * 30,
  };
};

const targetSignOf = (
  source: SourcePosition,
  subdivision: Subdivision,
  division: Exclude<typeof Division.Type, 1>,
): number => {
  const { signIndex: sourceSignIndex, degree: degreeInSourceSign } = source;
  const { partIndex } = subdivision;
  const oddRashi = sourceSignIndex % 2 === 0;
  const movable = sourceSignIndex % 3 === 0;
  const fixed = sourceSignIndex % 3 === 1;

  switch (division) {
    case 2:
      return sourceSignIndex <= 5
        ? sourceSignIndex * 2 + partIndex
        : (sourceSignIndex - 6) * 2 + partIndex;
    case 3:
      return (sourceSignIndex + [0, 4, 8][partIndex]!) % 12;
    case 4:
      return (sourceSignIndex + [0, 3, 6, 9][partIndex]!) % 12;
    case 7:
      return (sourceSignIndex + (oddRashi ? 0 : 6) + partIndex) % 12;
    case 9: {
      const start = movable ? sourceSignIndex : fixed ? sourceSignIndex + 8 : sourceSignIndex + 4;
      return (start + partIndex) % 12;
    }
    case 10: {
      const start = oddRashi ? sourceSignIndex : sourceSignIndex + 8;
      return (start + partIndex) % 12;
    }
    case 12:
      return (sourceSignIndex + partIndex) % 12;
    case 16:
      return ((movable ? 0 : fixed ? 4 : 8) + partIndex) % 12;
    case 20:
      return ((movable ? 0 : fixed ? 8 : 4) + partIndex) % 12;
    case 24:
      return ((oddRashi ? 4 : 3) + partIndex) % 12;
    case 27: {
      const start =
        sourceSignIndex % 4 === 0
          ? 0
          : sourceSignIndex % 4 === 1
            ? 3
            : sourceSignIndex % 4 === 2
              ? 6
              : 9;
      return (start + partIndex) % 12;
    }
    case 30: {
      const targets = oddRashi ? [0, 10, 8, 2, 6] : [1, 5, 11, 9, 7];
      const edges = oddRashi ? [5, 10, 18, 25] : [5, 12, 20, 25];
      const band = edges.findIndex((edge) => degreeInSourceSign < edge);
      return targets[band === -1 ? targets.length - 1 : band]!;
    }
    case 40:
      return ((oddRashi ? 0 : 6) + partIndex) % 12;
    case 45:
      return ((movable ? 0 : fixed ? 4 : 8) + partIndex) % 12;
    case 60:
      return (sourceSignIndex + partIndex) % 12;
  }
};

const divisionalTargetOf = ({
  signIndex,
  degree,
}: {
  readonly signIndex: number;
  readonly degree: number;
}): DivisionalTarget => ({
  signIndex,
  degree: Degree.make(degree),
  longitude: Longitude.make(signIndex * 30 + degree),
});

const identityTargetOf = (source: SourcePosition): DivisionalTarget => ({
  signIndex: source.signIndex,
  degree: Degree.make(source.degree),
  longitude: source.longitude,
});

export const normalizeLongitude = Effect.fn("Chart.DivisionalMapping.normalizeLongitude")(
  function* (longitude: number) {
    if (!Number.isFinite(longitude)) {
      return yield* new DivisionalMappingError({
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
  function* (longitude: number, division: typeof Division.Type) {
    const source = yield* normalizeLongitude(longitude).pipe(Effect.map(sourcePositionOf));

    if (division === 1) {
      return pipe(source, identityTargetOf);
    }

    const subdivision = subdivisionOf(source.degree, division);
    const signIndex = targetSignOf(source, subdivision, division);

    return pipe({ signIndex, degree: subdivision.degree }, divisionalTargetOf);
  },
);
