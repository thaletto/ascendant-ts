import { Array, Effect, Record } from "effect";

import { RASHIS } from "../chart/internal/constants.js";
import { signAt } from "../chart/internal/position.js";
import type { Placements } from "../chart/model.js";
import {
  ASHTAKAVARGA_ENTITY_ORDER,
  ASHTAKAVARGA_PLANET_ORDER,
  CONTRIBUTION_OFFSETS,
  DUAL_LORD_PAIRS,
  EXPECTED_BAV_TOTALS,
  EXPECTED_SAV_TOTAL,
  GRAHA_GUNAKAR,
  RASHI_GUNAKAR,
  TRIKONA_GROUPS,
} from "./constants.js";
import { SAVCalculationError } from "./error.js";
import {
  AshtakavargaEntities,
  AshtakavargaPlanets,
  AshtakavargaResult,
  AshtakavargaTotals,
  BhinnaAshtakavarga,
  Pinda,
  ReducedAshtakavarga,
  ShodhyaPinda,
  SignScores,
} from "./model.js";

type EntityPositions = Readonly<Record<AshtakavargaEntities, number>>;

const signScores = Effect.fn("SAV.signScores")(function* (scores: readonly number[]) {
  if (scores.length !== RASHIS.length) {
    return yield* SAVCalculationError.make({
      message: `Expected 12 sign scores; received ${scores.length}`,
      cause: { expected: RASHIS.length, actual: scores.length },
    });
  }
  return {
    Aries: Array.getUnsafe(scores, 0),
    Taurus: Array.getUnsafe(scores, 1),
    Gemini: Array.getUnsafe(scores, 2),
    Cancer: Array.getUnsafe(scores, 3),
    Leo: Array.getUnsafe(scores, 4),
    Virgo: Array.getUnsafe(scores, 5),
    Libra: Array.getUnsafe(scores, 6),
    Scorpio: Array.getUnsafe(scores, 7),
    Sagittarius: Array.getUnsafe(scores, 8),
    Capricorn: Array.getUnsafe(scores, 9),
    Aquarius: Array.getUnsafe(scores, 10),
    Pisces: Array.getUnsafe(scores, 11),
  } satisfies SignScores;
});

const total = (scores: SignScores): number => RASHIS.reduce((sum, rashi) => sum + scores[rashi], 0);

/**
 * Locates Lagna and the seven classical planets by Rashi, requiring exactly one
 * placement for every contributing planet before any Ashtakavarga table is built.
 */
const entityPositions = Effect.fn("SAV.entityPositions")(function* (placements: Placements) {
  const planetPosition = Effect.fn("planetPosition")(function* (name: AshtakavargaPlanets) {
    const matches = placements.planets.filter((planet) => planet.name === name);
    const match = matches[0];
    if (matches.length !== 1 || match === undefined) {
      return yield* SAVCalculationError.make({
        message: `Placements must contain exactly one ${name}; received ${matches.length}`,
        cause: { planet: name, count: matches.length },
      });
    }
    return Math.floor(match.longitude / 30) % 12;
  });

  const positions = yield* Effect.all(
    ASHTAKAVARGA_ENTITY_ORDER.map((entity) =>
      entity === "Lagna"
        ? Effect.succeed(Math.floor(placements.lagna.longitude / 30) % 12)
        : planetPosition(entity),
    ),
    { concurrency: "unbounded" },
  );

  return Record.fromEntries(
    ASHTAKAVARGA_ENTITY_ORDER.map((entity, i) => [entity, Array.getUnsafe(positions, i)]),
  ) as EntityPositions;
});

/**
 * Builds one Bhinna Ashtakavarga row by testing every contributor's classical
 * offset list relative to each target sign.
 */
const calculateSignScores = Effect.fn("SAV.calculateSignScores")(function* (
  target: AshtakavargaEntities,
  positions: EntityPositions,
) {
  return yield* signScores(
    RASHIS.map((_, signIndex) =>
      ASHTAKAVARGA_ENTITY_ORDER.reduce((score, contributor) => {
        const distance = ((signIndex - positions[contributor] + 12) % 12) + 1;
        return score + (CONTRIBUTION_OFFSETS[target][contributor].includes(distance) ? 1 : 0);
      }, 0),
    ),
  );
});

const calculateBhinna = Effect.fn("SAV.calculateBhinna")(function* (positions: EntityPositions) {
  const bhinnaEntries = yield* Effect.all(
    ASHTAKAVARGA_ENTITY_ORDER.map((entity) =>
      calculateSignScores(entity, positions).pipe(
        Effect.map((scores) => [entity, scores] as const),
      ),
    ),
    { concurrency: "unbounded" },
  );
  return Record.fromEntries(bhinnaEntries) as BhinnaAshtakavarga;
});

const validateBhinna = Effect.fn("SAV.validateBhinna")(function* (bhinna: BhinnaAshtakavarga) {
  yield* Effect.forEach(ASHTAKAVARGA_ENTITY_ORDER, (entity) =>
    Effect.sync(() => {
      const actual = total(bhinna[entity]);
      const expected = EXPECTED_BAV_TOTALS[entity];
      if (actual !== expected) {
        return SAVCalculationError.make({
          message: `Invalid ${entity} BAV total: ${actual}; expected ${expected}`,
          cause: { entity, actual, expected },
        });
      }
    }),
  );
});

const calculateSarva = Effect.fn("SAV.calculateSarva")(function* (bhinna: BhinnaAshtakavarga) {
  const sarva = yield* signScores(
    RASHIS.map((rashi) =>
      ASHTAKAVARGA_PLANET_ORDER.reduce((score, planet) => score + bhinna[planet][rashi], 0),
    ),
  );
  const actual = total(sarva);
  if (actual !== EXPECTED_SAV_TOTAL) {
    return yield* SAVCalculationError.make({
      message: `Invalid SAV total: ${actual}; expected ${EXPECTED_SAV_TOTAL}`,
      cause: { actual, expected: EXPECTED_SAV_TOTAL },
    });
  }
  return sarva;
});

/**
 * Applies classical Trikona reduction followed by Ekadhipatya reduction to one
 * BAV row. This preserves raw BAV/SAV and produces only the separate table used
 * for Shodhya Pinda.
 */
const reduceScores = Effect.fn("SAV.reduceScores")(function* (scores: SignScores) {
  const reduced = RASHIS.map((rashi) => scores[rashi]);

  for (const group of TRIKONA_GROUPS) {
    const minimum = Math.min(...group.map((index) => reduced[index] ?? 0));
    for (const index of group) reduced[index] = (reduced[index] ?? 0) - minimum;
  }

  for (const [first, second] of DUAL_LORD_PAIRS) {
    const firstValue = reduced[first] ?? 0;
    const secondValue = reduced[second] ?? 0;
    if (firstValue >= secondValue) {
      reduced[first] = firstValue - secondValue;
      reduced[second] = 0;
    } else {
      reduced[first] = 0;
      reduced[second] = secondValue - firstValue;
    }
  }

  return yield* signScores(reduced);
});

const calculateReduced = Effect.fn("SAV.calculateReduced")(function* (bhinna: BhinnaAshtakavarga) {
  const reducedEntries = yield* Effect.all(
    ASHTAKAVARGA_PLANET_ORDER.map((planet) =>
      reduceScores(bhinna[planet]).pipe(Effect.map((scores) => [planet, scores] as const)),
    ),
    { concurrency: "unbounded" },
  );
  return Record.fromEntries(reducedEntries) as ReducedAshtakavarga;
});

function calculatePlanetPinda(scores: SignScores, positions: EntityPositions): Pinda {
  const rashi_pinda = RASHIS.reduce(
    (sum, rashi, index) => sum + scores[rashi] * (RASHI_GUNAKAR[index] ?? 0),
    0,
  );
  const graha_pinda = ASHTAKAVARGA_PLANET_ORDER.reduce(
    (sum, planet) => sum + scores[signAt(positions[planet])] * GRAHA_GUNAKAR[planet],
    0,
  );
  return { rashi_pinda, graha_pinda, shodhya_pinda: rashi_pinda + graha_pinda } satisfies Pinda;
}

/** Computes Rashi Pinda, Graha Pinda, and their sum for every reduced planetary BAV row. */
function calculateShodhyaPinda(
  reduced: ReducedAshtakavarga,
  positions: EntityPositions,
): ShodhyaPinda {
  return Record.fromEntries(
    ASHTAKAVARGA_PLANET_ORDER.map(
      (planet) => [planet, calculatePlanetPinda(reduced[planet], positions)] as const,
    ),
  ) as ShodhyaPinda;
}

const calculateTotals = Effect.fn("SAV.calculateTotals")(function* (bhinna: BhinnaAshtakavarga) {
  const entityTotals = yield* Effect.all(
    ASHTAKAVARGA_ENTITY_ORDER.map((entity) =>
      Effect.sync(() => total(bhinna[entity])).pipe(Effect.map((t) => [entity, t] as const)),
    ),
    { concurrency: "unbounded" },
  );
  const sarvaTotal = total(yield* calculateSarva(bhinna));
  return Record.fromEntries([...entityTotals, ["sarva", sarvaTotal]]) as AshtakavargaTotals;
});

/**
 * Derives the full classical Ashtakavarga result from Placements: eight BAV
 * tables, seven-planet SAV, reduced planetary BAV, Shodhya Pinda, and invariant
 * totals. Canonical BAV and SAV totals are validated before reduction.
 */
export const calculate = Effect.fn("SAV.calculate")(function* (placements: Placements) {
  const positions = yield* entityPositions(placements);
  const bhinna = yield* calculateBhinna(positions);
  yield* validateBhinna(bhinna);
  const sarva = yield* calculateSarva(bhinna);
  const reduced = yield* calculateReduced(bhinna);
  const shodhya_pinda = calculateShodhyaPinda(reduced, positions);
  const totals = yield* calculateTotals(bhinna);

  return { bhinna, sarva, reduced, shodhya_pinda, totals } satisfies AshtakavargaResult;
});
