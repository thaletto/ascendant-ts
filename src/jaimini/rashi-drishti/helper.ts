import { HashSet } from "effect";

import { RASHIS } from "../../chart/internal/constants.js";
import { signAt } from "../../chart/internal/position.js";
import type { Rashis } from "../../chart/model.js";

const MOVABLE = HashSet.fromIterable([
  "Aries",
  "Cancer",
  "Libra",
  "Capricorn",
] as const satisfies readonly Rashis[]);
const FIXED = HashSet.fromIterable([
  "Taurus",
  "Leo",
  "Scorpio",
  "Aquarius",
] as const satisfies readonly Rashis[]);
const DUAL = HashSet.fromIterable([
  "Gemini",
  "Virgo",
  "Sagittarius",
  "Pisces",
] as const satisfies readonly Rashis[]);

export function targetsOf(reference: Rashis): readonly [Rashis, Rashis, Rashis] {
  const referenceIndex = RASHIS.indexOf(reference);
  const targets = RASHIS.filter((candidate) => {
    if (HashSet.has(MOVABLE, reference)) {
      return HashSet.has(FIXED, candidate) && candidate !== signAt(referenceIndex + 1);
    }
    if (HashSet.has(FIXED, reference)) {
      return HashSet.has(MOVABLE, candidate) && candidate !== signAt(referenceIndex - 1);
    }
    return HashSet.has(DUAL, candidate) && candidate !== reference;
  });

  const first = targets[0];
  const second = targets[1];
  const third = targets[2];
  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`Rashi Drishti did not produce three targets for ${reference}`);
  }

  return [first, second, third];
}
