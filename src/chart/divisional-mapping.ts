import { Degree, Division, Longitude } from "../types";

export const DIVISIONAL_MAPPING = "ascendant-divisional-mapping" as const;

export interface DivisionalTarget {
  readonly signIndex: number;
  readonly degree: Degree;
  readonly longitude: Longitude;
}

export const normalizeLongitude = (longitude: number): Longitude => {
  if (!Number.isFinite(longitude)) {
    throw new Error("Longitude must be finite");
  }
  const remainder = longitude % 360;
  return Longitude.make(remainder < 0 ? remainder + 360 : remainder);
};

export const getDivisionalTarget = (
  longitude: number,
  division: typeof Division.Type,
): DivisionalTarget => {
  const sourceLongitude = normalizeLongitude(longitude);
  const sourceSignIndex = Math.floor(sourceLongitude / 30);
  const degreeInSourceSign = sourceLongitude % 30;

  if (division === 1) {
    return {
      signIndex: sourceSignIndex,
      degree: Degree.make(degreeInSourceSign),
      longitude: sourceLongitude,
    };
  }

  const partSize = 30 / division;
  const scaledPart = degreeInSourceSign / partSize;
  const nearestPart = Math.round(scaledPart);
  const partPosition =
    nearestPart < division && Math.abs(scaledPart - nearestPart) < 1e-12 ? nearestPart : scaledPart;
  const partIndex = Math.min(division - 1, Math.floor(partPosition));
  const offsetInPart = partPosition - partIndex;
  const degree = offsetInPart * 30;
  let signIndex: number;
  const oddRashi = sourceSignIndex % 2 === 0;
  const movable = sourceSignIndex % 3 === 0;
  const fixed = sourceSignIndex % 3 === 1;

  switch (division) {
    case 2:
      signIndex =
        sourceSignIndex <= 5
          ? sourceSignIndex * 2 + partIndex
          : (sourceSignIndex - 6) * 2 + partIndex;
      break;
    case 3:
      signIndex = (sourceSignIndex + [0, 4, 8][partIndex]!) % 12;
      break;
    case 4:
      signIndex = (sourceSignIndex + [0, 3, 6, 9][partIndex]!) % 12;
      break;
    case 7:
      signIndex = (sourceSignIndex + (oddRashi ? 0 : 6) + partIndex) % 12;
      break;
    case 9: {
      const start = movable ? sourceSignIndex : fixed ? sourceSignIndex + 8 : sourceSignIndex + 4;
      signIndex = (start + partIndex) % 12;
      break;
    }
    case 10: {
      const start = oddRashi ? sourceSignIndex : sourceSignIndex + 8;
      signIndex = (start + partIndex) % 12;
      break;
    }
    case 12:
      signIndex = (sourceSignIndex + partIndex) % 12;
      break;
    case 16:
      signIndex = ((movable ? 0 : fixed ? 4 : 8) + partIndex) % 12;
      break;
    case 20:
      signIndex = ((movable ? 0 : fixed ? 8 : 4) + partIndex) % 12;
      break;
    case 24:
      signIndex = ((oddRashi ? 4 : 3) + partIndex) % 12;
      break;
    case 27: {
      const start =
        sourceSignIndex % 4 === 0
          ? 0
          : sourceSignIndex % 4 === 1
            ? 3
            : sourceSignIndex % 4 === 2
              ? 6
              : 9;
      signIndex = (start + partIndex) % 12;
      break;
    }
    case 30: {
      const targets = oddRashi ? [0, 10, 8, 2, 6] : [1, 5, 11, 9, 7];
      const edges = oddRashi ? [5, 10, 18, 25] : [5, 12, 20, 25];
      const band = edges.findIndex((edge) => degreeInSourceSign < edge);
      signIndex = targets[band === -1 ? targets.length - 1 : band]!;
      break;
    }
    case 40:
      signIndex = ((oddRashi ? 0 : 6) + partIndex) % 12;
      break;
    case 45:
      signIndex = ((movable ? 0 : fixed ? 4 : 8) + partIndex) % 12;
      break;
    case 60:
      signIndex = (sourceSignIndex + partIndex) % 12;
      break;
  }

  return {
    signIndex,
    degree: Degree.make(degree),
    longitude: Longitude.make(signIndex * 30 + degree),
  };
};
