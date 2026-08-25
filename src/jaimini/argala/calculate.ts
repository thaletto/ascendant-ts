import { Effect } from "effect";

import { PLANETS, RASHIS } from "../../internal/constant.js";
import { signAt, signIndexOf } from "../../internal/helper.js";
import { Planets, Rashis, type Placements } from "../../internal/model.js";
import { relation } from "./helper.js";
import type { Reference, Result } from "./model.js";
import { EvidenceError } from "./model.js";

export const calculate = Effect.fn("astro-ascendant/jaimini/argala/calculate")(function* (
  placements: Placements,
  reference: Reference,
) {
  const byPlanet = new Map<Planets, Placements["planets"][number]>();
  const occupants = new Map<Rashis, Planets[]>();
  for (const sign of RASHIS) occupants.set(sign, []);

  for (const planet of PLANETS) {
    const matches = placements.planets.filter((placement) => placement.name === planet);
    const match = matches[0];
    if (matches.length !== 1 || match === undefined) {
      return yield* EvidenceError.make({
        placement: planet,
        expected: 1,
        actual: matches.length,
      });
    }
    byPlanet.set(planet, match);
    const sign = signAt(signIndexOf(match.longitude));
    const signOccupants = occupants.get(sign);
    if (signOccupants === undefined) throw new Error(`Missing occupants for ${sign}`);
    signOccupants.push(planet);
  }

  const reverse = reference.kind === "Ketu";
  const ketu = byPlanet.get("Ketu");
  if (ketu === undefined) throw new Error("Missing validated Ketu placement");
  const referenceSign =
    reference.kind === "Sign" ? reference.sign : signAt(signIndexOf(ketu.longitude));
  const referenceIndex = RASHIS.indexOf(referenceSign);

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "structural-positions" as const,
      version: 1 as const,
    },
    reference,
    referenceSign,
    direction: reverse ? ("reverse" as const) : ("forward" as const),
    supporting: [
      relation(referenceIndex, 2, occupants, reverse),
      relation(referenceIndex, 4, occupants, reverse),
      relation(referenceIndex, 11, occupants, reverse),
    ],
    obstructing: [
      relation(referenceIndex, 12, occupants, reverse),
      relation(referenceIndex, 10, occupants, reverse),
      relation(referenceIndex, 3, occupants, reverse),
    ],
    secondarySupporting: relation(referenceIndex, 5, occupants, reverse),
    secondaryObstructing: relation(referenceIndex, 9, occupants, reverse),
  } satisfies Result;
});
