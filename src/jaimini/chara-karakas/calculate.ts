import { Effect, HashMap } from "effect";

import { Placements } from "../../chart/model.js";
import {
  CLASSICAL_PLANET_ORDER,
  ROLE_ORDER,
  exactDegreeOf,
  compareExactDegrees,
  hasSameDegree,
  assignmentAt,
} from "./helper.js";
import type { Result, Holder, Role, RankedHolder } from "./model.js";
import { EvidenceError, ParseError, Provenance } from "./model.js";

export const calculate = Effect.fn("astro-ascendant/jaimini/chara-karakas/calculate")(function* (
  placements: Placements,
) {
  const holders: RankedHolder[] = [];
  for (const planet of CLASSICAL_PLANET_ORDER) {
    const matches = placements.planets.filter((placement) => placement.name === planet);
    const match = matches[0];
    if (matches.length !== 1 || match === undefined) {
      return yield* EvidenceError.make({
        placement: planet,
        expected: 1,
        actual: matches.length,
      });
    }
    const exactDegree = yield* exactDegreeOf(match.longitude);
    holders.push({ planet, degree: exactDegree.value, exactDegree });
  }

  holders.sort(
    (left, right) =>
      compareExactDegrees(right.exactDegree, left.exactDegree) ||
      CLASSICAL_PLANET_ORDER.indexOf(left.planet) - CLASSICAL_PLANET_ORDER.indexOf(right.planet),
  );

  let byRole = HashMap.empty<Role, readonly [Holder, ...Holder[]]>();
  let rank = 0;
  while (rank < holders.length) {
    const first = holders[rank];
    if (first === undefined) {
      return yield* ParseError.make({ message: `Missing Chara Karaka holder at rank ${rank}` });
    }

    let nextRank = rank + 1;
    while (true) {
      const candidate = holders[nextRank];
      if (candidate === undefined || !hasSameDegree(candidate, first)) break;
      nextRank += 1;
    }
    const tiedRanks = holders.slice(rank, nextRank);
    const canonicalDegree = first.exactDegree.value;
    const tiedHolders = tiedRanks.map((holder): Holder => ({
      planet: holder.planet,
      degree: canonicalDegree,
    }));
    const firstTiedHolder = tiedHolders[0];
    if (firstTiedHolder === undefined) {
      return yield* ParseError.make({ message: `Missing tied holder at rank ${rank}` });
    }
    const nonEmptyTiedHolders: readonly [Holder, ...Holder[]] = [
      firstTiedHolder,
      ...tiedHolders.slice(1),
    ];

    for (let roleIndex = rank; roleIndex < nextRank; roleIndex += 1) {
      const role = ROLE_ORDER[roleIndex];
      if (role === undefined) {
        return yield* ParseError.make({
          message: `Missing Chara Karaka role at rank ${roleIndex}`,
        });
      }
      byRole = HashMap.set(byRole, role, nonEmptyTiedHolders);
    }
    rank = nextRank;
  }

  const Atmakaraka = yield* assignmentAt(byRole, "Atmakaraka");
  const Amatyakaraka = yield* assignmentAt(byRole, "Amatyakaraka");
  const Bhratrikaraka = yield* assignmentAt(byRole, "Bhratrikaraka");
  const Matrikaraka = yield* assignmentAt(byRole, "Matrikaraka");
  const Putrakaraka = yield* assignmentAt(byRole, "Putrakaraka");
  const Gnatikaraka = yield* assignmentAt(byRole, "Gnatikaraka");
  const Darakaraka = yield* assignmentAt(byRole, "Darakaraka");

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "exact-degree-shared-roles" as const,
      version: 1 as const,
    } satisfies Provenance,
    assignments: {
      Atmakaraka,
      Amatyakaraka,
      Bhratrikaraka,
      Matrikaraka,
      Putrakaraka,
      Gnatikaraka,
      Darakaraka,
    },
  } satisfies Result;
});
