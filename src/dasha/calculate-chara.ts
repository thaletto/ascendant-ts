import { Effect } from "effect";

import { RASHIS, SIGN_LORDS } from "../chart/internal/constants.js";
import { signAt, signIndexOf } from "../chart/internal/position.js";
import type { Moment, Placements, Planets, Rashis } from "../chart/model.js";
import { compareExactDegrees, exactDegreeOf } from "../jaimini/chara-karakas/helper.js";
import { DashaEvidenceError } from "./error.js";
import { validateUniquePlanetPlacements } from "./evidence.js";
import { CharaDasha } from "./model.js";
import { type Direction, RashiInternal, rashiIndex } from "./rashi-internal.js";

const SAMA_PADA = new Set<Rashis>(["Aries", "Taurus", "Gemini", "Libra", "Scorpio", "Sagittarius"]);

const placementOf = Effect.fn("Dasha.charaPlacementOf")(function* (
  placements: Placements,
  planet: Planets,
  context: string,
) {
  const matches = placements.planets.filter((placement) => placement.name === planet);
  const match = matches[0];
  if (matches.length !== 1 || match === undefined) {
    return yield* DashaEvidenceError.make({
      placement: planet,
      expected: 1,
      actual: matches.length,
      context,
    });
  }
  return match;
});

function padaDirection(sign: Rashis): Direction {
  return SAMA_PADA.has(sign) ? 1 : -1;
}

function distanceInDirection(from: number, to: number, direction: Direction): number {
  return ((to - from) * direction + RASHIS.length) % RASHIS.length;
}

const resolveCoLord = Effect.fn("Dasha.resolveCharaCoLord")(function* <Candidate extends Planets>(
  placements: Placements,
  sign: "Scorpio" | "Aquarius",
  candidates: readonly [Candidate, Candidate],
) {
  const targetIndex = rashiIndex(sign);
  const first = yield* placementOf(placements, candidates[0], `${sign} co-lord`);
  const second = yield* placementOf(placements, candidates[1], `${sign} co-lord`);
  const firstIndex = signIndexOf(first.longitude);
  const secondIndex = signIndexOf(second.longitude);
  const firstInSign = firstIndex === targetIndex;
  const secondInSign = secondIndex === targetIndex;

  if (firstInSign && secondInSign) {
    return null;
  }

  if (firstInSign !== secondInSign) {
    return firstInSign ? candidates[1] : candidates[0];
  }

  const firstAssociations = placements.planets.filter(
    (placement) =>
      placement.name !== candidates[0] && signIndexOf(placement.longitude) === firstIndex,
  ).length;
  const secondAssociations = placements.planets.filter(
    (placement) =>
      placement.name !== candidates[1] && signIndexOf(placement.longitude) === secondIndex,
  ).length;
  if (firstAssociations !== secondAssociations) {
    return firstAssociations > secondAssociations ? candidates[0] : candidates[1];
  }

  const firstDegree = yield* exactDegreeOf(first.longitude);
  const secondDegree = yield* exactDegreeOf(second.longitude);
  const degreeComparison = compareExactDegrees(firstDegree, secondDegree);
  if (degreeComparison !== 0) return degreeComparison > 0 ? candidates[0] : candidates[1];

  // An exact association-and-degree tie retains the traditional planet: Mars for
  // Scorpio and Saturn for Aquarius. This keeps the calculation total.
  return candidates[0];
});

const durationOf = Effect.fn("Dasha.charaDurationOf")(function* (
  placements: Placements,
  sign: Rashis,
) {
  const signIndex = rashiIndex(sign);
  let lord: Planets | null;

  if (sign === "Scorpio") {
    lord = yield* resolveCoLord(placements, sign, ["Mars", "Ketu"]);
  } else if (sign === "Aquarius") {
    lord = yield* resolveCoLord(placements, sign, ["Saturn", "Rahu"]);
  } else {
    lord = SIGN_LORDS[sign];
  }

  if (lord === null) return 12;
  const lordPlacement = yield* placementOf(placements, lord, `${sign} duration`);
  const distance = distanceInDirection(
    signIndex,
    signIndexOf(lordPlacement.longitude),
    padaDirection(sign),
  );
  return distance === 0 ? 12 : distance;
});

export const calculateChara = Effect.fn("astro-ascendant/dasha/calculateChara")(function* (
  moment: Moment,
  placements: Placements,
) {
  yield* validateUniquePlanetPlacements(placements, "Chara Dasha co-lord strength");
  const lagnaIndex = signIndexOf(placements.lagna.longitude);
  const ninthSign = signAt(lagnaIndex + 8);
  const direction = padaDirection(ninthSign);
  const sequence = RashiInternal.sequenceFrom(lagnaIndex, direction);
  const mahadashas = [];
  let mahadashaStart = moment.date;

  for (const mahadasha of sequence) {
    const years = yield* durationOf(placements, mahadasha);
    const mahadashaIndex = rashiIndex(mahadasha);
    const antardashaSequence = RashiInternal.sequenceFrom(mahadashaIndex + direction, direction);
    const period = RashiInternal.makeRashiMahaDasha(
      mahadasha,
      mahadashaStart,
      years,
      antardashaSequence,
    );
    mahadashas.push(period);
    mahadashaStart = period.end;
  }

  return CharaDasha.make({
    system: "Chara",
    provenance: {
      school: "Jaimini",
      method: "kn-rao-co-lord-strength",
      version: 2,
    },
    mahadashas,
  });
});
