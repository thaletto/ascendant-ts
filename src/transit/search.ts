import { DateTime, Effect } from "effect";

import { Ayanamsa } from "../astro-params/model.js";
import { Rashis } from "../chart/model.js";
import { JulianDay, type CelestialBody } from "../ephemeris/model.js";
import { Ephemeris } from "../ephemeris/service.js";
import { type Planets, type TransitDirection, type TransitKind } from "./model.js";

/** Julian Day of the Unix epoch; converts freely between JD and epoch millis. */
export const JD_UNIX_EPOCH = 2_440_587.5;
const DAYS_PER_YEAR = 365.25;
const MINUTES_PER_DAY = 1440;

export function normalize360(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function wrap180(degrees: number): number {
  return normalize360(degrees + 180) - 180;
}

export function millisFromJd(julianDay: number): number {
  return (julianDay - JD_UNIX_EPOCH) * 86_400_000;
}

export function dateTimeFromJd(julianDay: number) {
  return DateTime.makeUnsafe(millisFromJd(julianDay));
}

const PLANET_BODY: Record<Planets, CelestialBody> = {
  Sun: "Sun",
  Moon: "Moon",
  Mars: "Mars",
  Mercury: "Mercury",
  Jupiter: "Jupiter",
  Venus: "Venus",
  Saturn: "Saturn",
  Rahu: "MeanNode",
  Ketu: "MeanNode",
};

export const COARSE_STEP_DAYS: Record<Planets, number> = {
  Sun: 1,
  Moon: 0.25,
  Mars: 2,
  Mercury: 1,
  Venus: 1,
  Jupiter: 5,
  Saturn: 7,
  Rahu: 3,
  Ketu: 3,
};

export interface LongitudeSample {
  readonly julianDay: number;
  readonly longitude: number;
  readonly speed: number;
}

export interface FixedTarget {
  readonly kind: "longitude-hit" | "cusp-crossing";
  readonly longitude: number;
}

export interface SearchOptions {
  readonly planet: Planets;
  readonly fromJulianDay: number;
  readonly direction: TransitDirection;
  readonly count: number;
  readonly includeIngress: boolean;
  readonly includeStations: boolean;
  readonly fixedTargets: ReadonlyArray<FixedTarget>;
  readonly ayanamsa: typeof Ayanamsa.Type;
  readonly stepDays?: number;
  readonly precisionMinutes?: number;
  readonly maxYears?: number;
}

export interface RawHit {
  readonly julianDay: number;
  readonly longitude: number;
  readonly speed: number;
  readonly kind: TransitKind;
  readonly sign: Rashis;
}

export interface SearchOutcome {
  readonly hits: ReadonlyArray<RawHit>;
  readonly complete: boolean;
  readonly endJulianDay: number;
}

export const sampleAt = Effect.fn("Transit.sampleAt")(function* (
  julianDay: number,
  planet: Planets,
  ayanamsa: typeof Ayanamsa.Type,
) {
  const ephemeris = yield* Ephemeris;
  const position = yield* ephemeris.calculatePosition(
    JulianDay.make(julianDay),
    PLANET_BODY[planet],
    ayanamsa,
  );
  const raw = planet === "Ketu" ? position.longitude + 180 : position.longitude;
  return {
    julianDay,
    longitude: normalize360(raw),
    speed: position.longitudeSpeed,
  } satisfies LongitudeSample;
});

function signIndexOf(longitude: number): number {
  return Math.floor(normalize360(longitude) / 30) % 12;
}

function signAt(index: number): Rashis {
  return Rashis.literals[((index % 12) + 12) % 12]!;
}

/** Sign entered when traversing `boundary` in `direction`. */
function enteredSign(
  boundary: number,
  direction: TransitDirection,
  longitudeRising: boolean,
): Rashis {
  const index = Math.round(normalize360(boundary) / 30) % 12;
  const rising = direction === "forward" ? longitudeRising : !longitudeRising;
  return rising ? signAt(index) : signAt(index - 1);
}

function isBoundaryTarget(target: number): boolean {
  return normalize360(target) % 30 === 0;
}

/** Multiple of 30 crossed between two samples, with the longitude trend. */
function crossedBoundary(
  earlier: number,
  later: number,
): { boundary: number; rising: boolean } | null {
  if (signIndexOf(earlier) === signIndexOf(later)) return null;
  const low = Math.min(earlier, later);
  const high = Math.max(earlier, later);
  if (high - low > 180) return { boundary: 0, rising: earlier > later };
  const boundary = (Math.ceil(low / 30 - 1e-9) * 30) % 360;
  if (boundary > high + 1e-9) return null;
  return { boundary, rising: later > earlier };
}

const refineValue = Effect.fn("Transit.refineValue")(function* (
  low: LongitudeSample,
  high: LongitudeSample,
  planet: Planets,
  ayanamsa: typeof Ayanamsa.Type,
  precisionMinutes: number,
  valueOf: (sample: LongitudeSample) => number,
) {
  let lower = low;
  let upper = high;
  let lowValue = valueOf(lower);
  for (let iteration = 0; iteration < 60; iteration += 1) {
    if ((upper.julianDay - lower.julianDay) * MINUTES_PER_DAY <= precisionMinutes) break;
    const midDay = (lower.julianDay + upper.julianDay) / 2;
    const mid = yield* sampleAt(midDay, planet, ayanamsa);
    const midValue = valueOf(mid);
    if (Math.sign(midValue) === Math.sign(lowValue) && midValue !== 0) {
      lower = mid;
      lowValue = midValue;
    } else {
      upper = mid;
    }
  }
  return yield* sampleAt((lower.julianDay + upper.julianDay) / 2, planet, ayanamsa);
});

const refineLongitude = Effect.fn("Transit.refineLongitude")(function* (
  low: LongitudeSample,
  high: LongitudeSample,
  planet: Planets,
  ayanamsa: typeof Ayanamsa.Type,
  precisionMinutes: number,
  target: number,
) {
  return yield* refineValue(low, high, planet, ayanamsa, precisionMinutes, (sample) =>
    wrap180(sample.longitude - target),
  );
});

const refineStation = Effect.fn("Transit.refineStation")(function* (
  low: LongitudeSample,
  high: LongitudeSample,
  planet: Planets,
  ayanamsa: typeof Ayanamsa.Type,
  precisionMinutes: number,
) {
  return yield* refineValue(
    low,
    high,
    planet,
    ayanamsa,
    precisionMinutes,
    (sample) => sample.speed,
  );
});

const refineStep = Effect.fn("Transit.refineStep")(function* (
  earlier: LongitudeSample,
  later: LongitudeSample,
  options: SearchOptions,
) {
  const hits: Array<RawHit> = [];
  const precision = options.precisionMinutes ?? 1;
  const push = (sample: LongitudeSample, kind: TransitKind, sign: Rashis) => {
    const previous = hits[hits.length - 1];
    if (
      previous !== undefined &&
      previous.kind === kind &&
      Math.abs(sample.julianDay - previous.julianDay) * MINUTES_PER_DAY < precision
    ) {
      return;
    }
    hits.push({
      julianDay: sample.julianDay,
      longitude: sample.longitude,
      speed: sample.speed,
      kind,
      sign,
    });
  };

  if (options.includeIngress) {
    const crossed = crossedBoundary(earlier.longitude, later.longitude);
    if (crossed !== null) {
      const refined = yield* refineLongitude(
        earlier,
        later,
        options.planet,
        options.ayanamsa,
        precision,
        crossed.boundary,
      );
      push(
        refined,
        "sign-ingress",
        enteredSign(crossed.boundary, options.direction, crossed.rising),
      );
    }
  }

  for (const target of options.fixedTargets) {
    const early = wrap180(earlier.longitude - target.longitude);
    const late = wrap180(later.longitude - target.longitude);
    if (early === 0 || late === 0 || Math.sign(early) !== Math.sign(late)) {
      const refined = yield* refineLongitude(
        earlier,
        later,
        options.planet,
        options.ayanamsa,
        precision,
        target.longitude,
      );
      const rising = wrap180(later.longitude - earlier.longitude) > 0;
      push(
        refined,
        target.kind,
        isBoundaryTarget(target.longitude)
          ? enteredSign(target.longitude, options.direction, rising)
          : signAt(signIndexOf(refined.longitude)),
      );
    }
  }

  if (options.includeStations) {
    const earlySpeed = earlier.speed;
    const lateSpeed = later.speed;
    if (earlySpeed === 0 || lateSpeed === 0 || earlySpeed < 0 !== lateSpeed < 0) {
      const refined = yield* refineStation(
        earlier,
        later,
        options.planet,
        options.ayanamsa,
        precision,
      );
      push(refined, "station", signAt(signIndexOf(refined.longitude)));
    }
  }

  return hits.toSorted((first, second) =>
    options.direction === "forward"
      ? first.julianDay - second.julianDay
      : second.julianDay - first.julianDay,
  );
});

/**
 * Sweeps coarse steps from `fromJulianDay`, refining every bracketed
 * crossing. Each zero-crossing counts, so retrograde triples yield three
 * hits in strict time order. Returns `complete: false` with the hits found
 * when `maxYears` runs out instead of silently returning a short list.
 */
export const searchRawHits = Effect.fn("Transit.searchRawHits")(function* (options: SearchOptions) {
  const forward = options.direction === "forward";
  const sign = forward ? 1 : -1;
  const step = (options.stepDays ?? COARSE_STEP_DAYS[options.planet]) * sign;
  const spanDays = (options.maxYears ?? 30) * DAYS_PER_YEAR * sign;
  const limit = options.fromJulianDay + spanDays;
  const maxIterations = Math.ceil(Math.abs(spanDays / step)) + 2;

  const hits: Array<RawHit> = [];
  let cursor = options.fromJulianDay;
  let previous = yield* sampleAt(cursor, options.planet, options.ayanamsa);
  let complete = false;

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    if (hits.length >= options.count) {
      complete = true;
      break;
    }
    if (forward ? cursor >= limit : cursor <= limit) break;
    const next = yield* sampleAt(cursor + step, options.planet, options.ayanamsa);
    const earlier = forward ? previous : next;
    const later = forward ? next : previous;
    const stepHits = yield* refineStep(earlier, later, options);
    for (const hit of stepHits) {
      if (hits.length >= options.count) break;
      const last = hits[hits.length - 1];
      const precision = options.precisionMinutes ?? 1;
      if (
        last !== undefined &&
        last.kind === hit.kind &&
        Math.abs(hit.julianDay - last.julianDay) * MINUTES_PER_DAY < precision
      ) {
        continue;
      }
      hits.push(hit);
    }
    previous = next;
    cursor += step;
  }

  if (hits.length >= options.count) complete = true;
  return { hits, complete, endJulianDay: cursor } satisfies SearchOutcome;
});
