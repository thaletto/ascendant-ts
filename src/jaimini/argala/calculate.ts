import { Effect, HashMap, Option } from "effect";

import { PLANETS, RASHIS } from "../../chart/internal/constants.js";
import { signAt, signIndexOf } from "../../chart/internal/position.js";
import { Planets, Rashis, type Placements } from "../../chart/model.js";
import { relation } from "./helper.js";
import type { Reference, Result } from "./model.js";
import { EvidenceError } from "./model.js";

export const calculate = Effect.fn("astro-ascendant/jaimini/argala/calculate")(function* (
  placements: Placements,
  reference: Reference,
) {
  let byPlanet = HashMap.empty<Planets, Placements["planets"][number]>();
  let occupants: HashMap.HashMap<Rashis, readonly Planets[]> = HashMap.fromIterable(
    RASHIS.map((sign) => [sign, []] as const),
  );

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
    byPlanet = HashMap.set(byPlanet, planet, match);
    const sign = signAt(signIndexOf(match.longitude));
    const signOccupants = HashMap.get(occupants, sign);
    if (Option.isNone(signOccupants)) throw new Error(`Missing occupants for ${sign}`);
    occupants = HashMap.set(occupants, sign, [...signOccupants.value, planet]);
  }

  const reverse = reference.kind === "Ketu";
  const ketu = HashMap.get(byPlanet, "Ketu");
  if (Option.isNone(ketu)) throw new Error("Missing validated Ketu placement");
  const referenceSign =
    reference.kind === "Sign" ? reference.sign : signAt(signIndexOf(ketu.value.longitude));
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
