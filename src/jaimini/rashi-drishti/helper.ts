import { RASHIS } from "../../internal/constant.js";
import { signAt } from "../../internal/helper.js";
import type { Rashis } from "../../internal/model.js";

export const MOVABLE = new Set<Rashis>(["Aries", "Cancer", "Libra", "Capricorn"]);
export const FIXED = new Set<Rashis>(["Taurus", "Leo", "Scorpio", "Aquarius"]);
export const DUAL = new Set<Rashis>(["Gemini", "Virgo", "Sagittarius", "Pisces"]);

export function targetsOf(reference: Rashis): readonly [Rashis, Rashis, Rashis] {
  const referenceIndex = RASHIS.indexOf(reference);
  const targets = RASHIS.filter((candidate) => {
    if (MOVABLE.has(reference)) {
      return FIXED.has(candidate) && candidate !== signAt(referenceIndex + 1);
    }
    if (FIXED.has(reference)) {
      return MOVABLE.has(candidate) && candidate !== signAt(referenceIndex - 1);
    }
    return DUAL.has(candidate) && candidate !== reference;
  });

  const first = targets[0];
  const second = targets[1];
  const third = targets[2];
  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`Rashi Drishti did not produce three targets for ${reference}`);
  }

  return [first, second, third];
}
