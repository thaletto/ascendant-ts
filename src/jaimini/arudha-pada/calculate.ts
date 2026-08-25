import { Effect } from "effect";

import { signAt, signIndexOf } from "../../internal/helper.js";
import { Houses, type Placements } from "../../internal/model.js";
import { distanceBetween, lordOfSign, projectedSign, sourceSignOf } from "./helper.js";
import type { Result } from "./model.js";
import { EvidenceError, Provenance } from "./model.js";

export const calculate = Effect.fn("astro-ascendant/jaimini/arudha-pada/calculate")(function* (
  placements: Placements,
  house: Houses,
) {
  const lagnaSignIndex = signIndexOf(placements.lagna.longitude);
  const sourceSign = sourceSignOf(house)(lagnaSignIndex);
  const lord = lordOfSign(sourceSign);

  const matches = placements.planets.filter((planet) => planet.name === lord);
  const lordPlacement = matches[0];
  if (matches.length !== 1 || lordPlacement === undefined) {
    return yield* EvidenceError.make({
      placement: lord,
      expected: 1,
      actual: matches.length,
    });
  }

  const lordSignIndex = signIndexOf(lordPlacement.longitude);
  const distance = distanceBetween(lordSignIndex)(lagnaSignIndex + house - 1);
  const lordSign = signAt(lordSignIndex);
  const sign = projectedSign(distance)(lordSignIndex);

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "plain-projection" as const,
      version: 1 as const,
    } satisfies Provenance,
    house,
    sourceSign,
    lord,
    lordSign,
    sign,
  } satisfies Result;
});
