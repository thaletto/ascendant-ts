import { Effect } from "effect";

import type { Placements, Rashis } from "../chart/model.js";
import {
  ASHTAKAVARGA_ENTITY_ORDER,
  ASHTAKAVARGA_PLANET_ORDER,
  CONTRIBUTION_OFFSETS,
  DUAL_LORD_PAIRS,
  EXPECTED_BAV_TOTALS,
  EXPECTED_SAV_TOTAL,
  GRAHA_GUNAKAR,
  RASHI_GUNAKAR,
  RASHI_ORDER,
  TRIKONA_GROUPS,
} from "./constants.js";
import { SAVCalculationError } from "./error.js";
import {
  AshtakavargaEntities,
  AshtakavargaPlanets,
  AshtakavargaResult,
  BhinnaAshtakavarga,
  Pinda,
  ReducedAshtakavarga,
  ShodhyaPinda,
  SignScores,
} from "./model.js";

type EntityPositions = Readonly<Record<typeof AshtakavargaEntities.Type, number>>;

function signScores(scores: readonly number[]): typeof SignScores.Type {
  if (scores.length !== RASHI_ORDER.length) {
    throw new Error(`Expected 12 sign scores; received ${scores.length}`);
  }
  const score = (index: number): number => {
    const value = scores[index];
    if (value === undefined) throw new Error(`Missing score for sign index ${index}`);
    return value;
  };
  return {
    Aries: score(0),
    Taurus: score(1),
    Gemini: score(2),
    Cancer: score(3),
    Leo: score(4),
    Virgo: score(5),
    Libra: score(6),
    Scorpio: score(7),
    Sagittarius: score(8),
    Capricorn: score(9),
    Aquarius: score(10),
    Pisces: score(11),
  };
}

function rashiAt(index: number): typeof Rashis.Type {
  const rashi = RASHI_ORDER[index];
  if (rashi === undefined) throw new Error(`Invalid Rashi index: ${index}`);
  return rashi;
}

function total(scores: typeof SignScores.Type): number {
  return RASHI_ORDER.reduce((sum, rashi) => sum + scores[rashi], 0);
}

function entityPositions(placements: Placements): EntityPositions {
  const planetPosition = (name: typeof AshtakavargaPlanets.Type): number => {
    const matches = placements.planets.filter((planet) => planet.name === name);
    const match = matches[0];
    if (matches.length !== 1 || match === undefined) {
      throw new Error(`Placements must contain exactly one ${name}; received ${matches.length}`);
    }
    return Math.floor(match.longitude / 30) % 12;
  };

  return {
    Sun: planetPosition("Sun"),
    Moon: planetPosition("Moon"),
    Mars: planetPosition("Mars"),
    Mercury: planetPosition("Mercury"),
    Jupiter: planetPosition("Jupiter"),
    Venus: planetPosition("Venus"),
    Saturn: planetPosition("Saturn"),
    Lagna: Math.floor(placements.lagna.longitude / 30) % 12,
  };
}

function calculateSignScores(
  target: typeof AshtakavargaEntities.Type,
  positions: EntityPositions,
): typeof SignScores.Type {
  return signScores(
    RASHI_ORDER.map((_, signIndex) =>
      ASHTAKAVARGA_ENTITY_ORDER.reduce((score, contributor) => {
        const distance = ((signIndex - positions[contributor] + 12) % 12) + 1;
        return score + (CONTRIBUTION_OFFSETS[target][contributor].includes(distance) ? 1 : 0);
      }, 0),
    ),
  );
}

function calculateBhinna(positions: EntityPositions): typeof BhinnaAshtakavarga.Type {
  return {
    Sun: calculateSignScores("Sun", positions),
    Moon: calculateSignScores("Moon", positions),
    Mars: calculateSignScores("Mars", positions),
    Mercury: calculateSignScores("Mercury", positions),
    Jupiter: calculateSignScores("Jupiter", positions),
    Venus: calculateSignScores("Venus", positions),
    Saturn: calculateSignScores("Saturn", positions),
    Lagna: calculateSignScores("Lagna", positions),
  };
}

function validateBhinna(bhinna: typeof BhinnaAshtakavarga.Type): void {
  for (const entity of ASHTAKAVARGA_ENTITY_ORDER) {
    const actual = total(bhinna[entity]);
    const expected = EXPECTED_BAV_TOTALS[entity];
    if (actual !== expected) {
      throw new Error(`Invalid ${entity} BAV total: ${actual}; expected ${expected}`);
    }
  }
}

function calculateSarva(bhinna: typeof BhinnaAshtakavarga.Type): typeof SignScores.Type {
  const sarva = signScores(
    RASHI_ORDER.map((rashi) =>
      ASHTAKAVARGA_PLANET_ORDER.reduce((score, planet) => score + bhinna[planet][rashi], 0),
    ),
  );
  const actual = total(sarva);
  if (actual !== EXPECTED_SAV_TOTAL) {
    throw new Error(`Invalid SAV total: ${actual}; expected ${EXPECTED_SAV_TOTAL}`);
  }
  return sarva;
}

function reduceScores(scores: typeof SignScores.Type): typeof SignScores.Type {
  const reduced = RASHI_ORDER.map((rashi) => scores[rashi]);

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

  return signScores(reduced);
}

function calculateReduced(bhinna: typeof BhinnaAshtakavarga.Type): typeof ReducedAshtakavarga.Type {
  return {
    Sun: reduceScores(bhinna.Sun),
    Moon: reduceScores(bhinna.Moon),
    Mars: reduceScores(bhinna.Mars),
    Mercury: reduceScores(bhinna.Mercury),
    Jupiter: reduceScores(bhinna.Jupiter),
    Venus: reduceScores(bhinna.Venus),
    Saturn: reduceScores(bhinna.Saturn),
  };
}

function calculatePlanetPinda(scores: typeof SignScores.Type, positions): typeof Pinda.Type {
  const rashi_pinda = RASHI_ORDER.reduce(
    (sum, rashi, index) => sum + scores[rashi] * (RASHI_GUNAKAR[index] ?? 0),
    0,
  );
  const graha_pinda = ASHTAKAVARGA_PLANET_ORDER.reduce(
    (sum, planet) => sum + scores[rashiAt(positions[planet])] * GRAHA_GUNAKAR[planet],
    0,
  );
  return { rashi_pinda, graha_pinda, shodhya_pinda: rashi_pinda + graha_pinda };
}

function calculateShodhyaPinda(
  reduced: ReducedAshtakavarga,
  positions: EntityPositions,
): ShodhyaPinda {
  return {
    Sun: calculatePlanetPinda(reduced.Sun, positions),
    Moon: calculatePlanetPinda(reduced.Moon, positions),
    Mars: calculatePlanetPinda(reduced.Mars, positions),
    Mercury: calculatePlanetPinda(reduced.Mercury, positions),
    Jupiter: calculatePlanetPinda(reduced.Jupiter, positions),
    Venus: calculatePlanetPinda(reduced.Venus, positions),
    Saturn: calculatePlanetPinda(reduced.Saturn, positions),
  };
}

function calculate(placements: Placements): AshtakavargaResult {
  const positions = entityPositions(placements);
  const bhinna = calculateBhinna(positions);
  validateBhinna(bhinna);
  const sarva = calculateSarva(bhinna);
  const reduced = calculateReduced(bhinna);
  const shodhya_pinda = calculateShodhyaPinda(reduced, positions);

  return {
    bhinna,
    sarva,
    reduced,
    shodhya_pinda,
    totals: {
      Sun: total(bhinna.Sun),
      Moon: total(bhinna.Moon),
      Mars: total(bhinna.Mars),
      Mercury: total(bhinna.Mercury),
      Jupiter: total(bhinna.Jupiter),
      Venus: total(bhinna.Venus),
      Saturn: total(bhinna.Saturn),
      Lagna: total(bhinna.Lagna),
      sarva: total(sarva),
    },
  };
}

export function makeCalculate() {
  return Effect.fn("SAV.calculate")(function* (placements: Placements) {
    return yield* Effect.try({
      try: () => calculate(placements),
      catch: (cause) =>
        new SAVCalculationError({
          message: "Could not calculate Parashari Ashtakavarga",
          cause,
        }),
    });
  });
}
