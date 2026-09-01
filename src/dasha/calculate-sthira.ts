import { Effect } from "effect";

import { inSignStatus } from "../chart/helper.js";
import { SIGN_LORDS } from "../chart/internal/constants.js";
import { signAt, signIndexOf } from "../chart/internal/position.js";
import type { Moment, Placements, Planets, Rashis } from "../chart/model.js";
import { compareExactDegrees, exactDegreeOf } from "../jaimini/chara-karakas/helper.js";
import * as CharaKarakas from "../jaimini/chara-karakas/index.js";
import type { ClassicalPlanets, ExactDegree, Role } from "../jaimini/chara-karakas/model.js";
import { targetsOf } from "../jaimini/rashi-drishti/helper.js";
import { DashaEvidenceError } from "./error.js";
import { validateUniquePlanetPlacements } from "./evidence.js";
import type { BrahmaCandidateScore, EligibleBrahmaPlanet, RashiBala } from "./model.js";
import { SthiraDasha } from "./model.js";
import { RashiInternal, rashiIndex } from "./rashi-internal.js";

const ELIGIBLE_BRAHMA_PLANETS = new Set<Planets>([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
]);

const DIGNITY_BALA = {
  EXALTED: 60,
  MOOLA_TRIKONA: 45,
  OWN: 30,
  FRIEND: 22.5,
  NEUTRAL: 15,
  ENEMY: 7.5,
  DEBILITATED: 3.75,
} as const;

const KARAKA_BALA: Record<Role, number> = {
  Atmakaraka: 60,
  Amatyakaraka: 45,
  Bhratrikaraka: 30,
  Matrikaraka: 22.5,
  Putrakaraka: 15,
  Gnatikaraka: 7.5,
  Darakaraka: 3.75,
};

const NATURAL_STRENGTH: Record<ClassicalPlanets, number> = {
  Sun: 7,
  Moon: 6,
  Venus: 5,
  Jupiter: 4,
  Mercury: 3,
  Mars: 2,
  Saturn: 1,
};

const placementOf = Effect.fn("Dasha.brahmaPlacementOf")(function* (
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

function isEligibleBrahma(planet: Planets): planet is EligibleBrahmaPlanet {
  return ELIGIBLE_BRAHMA_PLANETS.has(planet);
}

function charaBalaOf(sign: Rashis): number {
  const modality = rashiIndex(sign) % 3;
  return modality === 0 ? 15 : modality === 1 ? 30 : 60;
}

function kendradiBalaOf(house: number): number {
  const remainder = (house - 1) % 3;
  return remainder === 0 ? 60 : remainder === 1 ? 30 : 15;
}

function durationOf(sign: Rashis): 7 | 8 | 9 {
  const modality = rashiIndex(sign) % 3;
  return modality === 0 ? 7 : modality === 1 ? 8 : 9;
}

const rashiBalaOf = Effect.fn("Dasha.rashiBalaOf")(function* (
  placements: Placements,
  sign: Rashis,
) {
  const lord = SIGN_LORDS[sign];
  const aspectingPlanets: Planets[] = [];
  for (const planet of [lord, "Jupiter", "Mercury"] as const) {
    if (aspectingPlanets.includes(planet)) continue;
    const placement = yield* placementOf(placements, planet, "Rashi Bala drishti");
    if (targetsOf(signAt(signIndexOf(placement.longitude))).includes(sign)) {
      aspectingPlanets.push(planet);
    }
  }
  const planetCount = placements.planets.filter(
    (placement) => signIndexOf(placement.longitude) === rashiIndex(sign),
  ).length;
  const charaBala = charaBalaOf(sign);
  const sthiraBala = planetCount === 0 ? 0 : 45 + 15 * planetCount;
  const drishtiBala = aspectingPlanets.length * 60;
  return {
    sign,
    charaBala,
    sthiraBala,
    drishtiBala,
    planetCount,
    aspectingPlanets,
    total: charaBala + sthiraBala + drishtiBala,
  } satisfies RashiBala;
});

export const calculateSthira = Effect.fn("astro-ascendant/dasha/calculateSthira")(function* (
  moment: Moment,
  placements: Placements,
) {
  yield* validateUniquePlanetPlacements(placements, "Sthira Dasha strength");
  const lagnaSignIndex = signIndexOf(placements.lagna.longitude);
  const lagnaSign = signAt(lagnaSignIndex);
  const seventhSign = signAt(lagnaSignIndex + 6);
  const lagnaRashiBala = yield* rashiBalaOf(placements, lagnaSign);
  const seventhRashiBala = yield* rashiBalaOf(placements, seventhSign);
  const referenceSign = lagnaRashiBala.total >= seventhRashiBala.total ? lagnaSign : seventhSign;

  const rawCandidates = [5, 7, 11].map(
    (offset) => SIGN_LORDS[signAt(rashiIndex(referenceSign) + offset)],
  );
  const candidates = rawCandidates
    .filter(isEligibleBrahma)
    .filter((candidate, index, values) => values.indexOf(candidate) === index);
  const firstCandidate = candidates[0];
  if (firstCandidate === undefined) {
    return yield* DashaEvidenceError.make({
      placement: "Lagna",
      expected: 1,
      actual: 0,
      context: "No eligible Brahma candidates remain after excluding Saturn, Rahu, and Ketu",
    });
  }

  const karakas = yield* CharaKarakas.calculate(placements).pipe(
    Effect.mapError((error) => {
      if (error._tag === "CharaKarakasEvidenceError") {
        return DashaEvidenceError.make({
          placement: error.placement,
          expected: 1,
          actual: error.actual,
          context: "Brahma Chara Karaka Bala",
        });
      }
      return DashaEvidenceError.make({
        placement: "Lagna",
        expected: 1,
        actual: 0,
        context: `Brahma Chara Karaka Bala: ${error.message}`,
      });
    }),
  );
  const atmakaraka = karakas.assignments.Atmakaraka.reduce((strongest, holder) =>
    NATURAL_STRENGTH[holder.planet] > NATURAL_STRENGTH[strongest.planet] ? holder : strongest,
  );
  const atmakarakaPlacement = yield* placementOf(
    placements,
    atmakaraka.planet,
    "Brahma Kendradi Bala Atmakaraka",
  );
  const atmakarakaSignIndex = signIndexOf(atmakarakaPlacement.longitude);

  const scoredWithExactDegrees: Array<
    BrahmaCandidateScore & { readonly exactDegree: ExactDegree }
  > = [];
  for (const candidate of candidates) {
    const placement = yield* placementOf(placements, candidate, "Brahma Graha Bala");
    const [dignity] = inSignStatus(candidate, placement.longitude);
    if (dignity === undefined) return yield* Effect.die(`Missing dignity for ${candidate}`);
    const charaKarakaRoles = (
      Object.entries(karakas.assignments) as Array<[Role, readonly { readonly planet: Planets }[]]>
    )
      .filter(([, holders]) => holders.some((holder) => holder.planet === candidate))
      .map(([role]) => role);
    const charaKarakaBala = Math.max(...charaKarakaRoles.map((role) => KARAKA_BALA[role]));
    const signIndex = signIndexOf(placement.longitude);
    const kendradiHouseFromAtmakaraka = ((signIndex - atmakarakaSignIndex + 12) % 12) + 1;
    const kendradiBala = kendradiBalaOf(kendradiHouseFromAtmakaraka);
    const exactDegree = yield* exactDegreeOf(placement.longitude);
    scoredWithExactDegrees.push({
      planet: candidate,
      sign: signAt(signIndex),
      dignity,
      dignityBala: DIGNITY_BALA[dignity],
      charaKarakaRoles,
      charaKarakaBala,
      kendradiHouseFromAtmakaraka,
      kendradiBala,
      exactDegreeWithinSign: exactDegree.value,
      naturalStrength: NATURAL_STRENGTH[candidate],
      total: DIGNITY_BALA[dignity] + charaKarakaBala + kendradiBala,
      exactDegree,
    });
  }
  scoredWithExactDegrees.sort(
    (left, right) =>
      right.total - left.total ||
      compareExactDegrees(right.exactDegree, left.exactDegree) ||
      right.naturalStrength - left.naturalStrength,
  );
  const winner = scoredWithExactDegrees[0];
  if (winner === undefined) return yield* Effect.die("Missing scored Brahma candidate");
  const candidateScores = scoredWithExactDegrees.map((score): BrahmaCandidateScore => ({
    planet: score.planet,
    sign: score.sign,
    dignity: score.dignity,
    dignityBala: score.dignityBala,
    charaKarakaRoles: score.charaKarakaRoles,
    charaKarakaBala: score.charaKarakaBala,
    kendradiHouseFromAtmakaraka: score.kendradiHouseFromAtmakaraka,
    kendradiBala: score.kendradiBala,
    exactDegreeWithinSign: score.exactDegreeWithinSign,
    naturalStrength: score.naturalStrength,
    total: score.total,
  }));

  const brahmaSignIndex = rashiIndex(winner.sign);
  const sequence = RashiInternal.sequenceFrom(brahmaSignIndex, 1);
  const mahadashas = [];
  let mahadashaStart = moment.date;
  for (const mahadasha of sequence) {
    const period = RashiInternal.makeRashiMahaDasha(
      mahadasha,
      mahadashaStart,
      durationOf(mahadasha),
      RashiInternal.sequenceFrom(rashiIndex(mahadasha), 1),
    );
    mahadashas.push(period);
    mahadashaStart = period.end;
  }

  return SthiraDasha.make({
    system: "Sthira",
    provenance: {
      school: "Jaimini",
      method: "bv-raman-koch-brahma-strength",
      version: 2,
    },
    brahma: {
      planet: winner.planet,
      sign: winner.sign,
      source: "strength",
      selection: {
        rashiBalas: [lagnaRashiBala, seventhRashiBala],
        referenceSign,
        referenceTieBreak: "lagna-on-equal-rashi-bala",
        atmakaraka: {
          planet: atmakaraka.planet,
          sign: signAt(atmakarakaSignIndex),
          resolution:
            karakas.assignments.Atmakaraka.length === 1
              ? "highest-exact-degree"
              : "natural-strength-on-exact-degree-tie",
        },
        candidates: [candidateScores[0]!, ...candidateScores.slice(1)],
      },
    },
    mahadashas,
  });
});
