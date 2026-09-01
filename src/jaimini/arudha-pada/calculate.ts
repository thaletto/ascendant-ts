import { Effect } from "effect";

import { signAt, signIndexOf } from "../../chart/internal/position.js";
import { Houses, type Placements } from "../../chart/model.js";
import { methods } from "../../provenance.js";
import { distanceBetween, lordOfSign, projectedSign, sourceSignOf } from "./helper.js";
import type { Result } from "./model.js";
import { EvidenceError } from "./model.js";

/**
 * Projects a requested D1 house's sign through its lord using the plain Arudha
 * rule. The result deliberately does not apply exceptional source- or seventh-
 * sign adjustments and reports the full derivation evidence.
 */
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
    provenance: methods.jaiminiArudhaPada.provenance,
    house,
    sourceSign,
    lord,
    lordSign,
    sign,
  } satisfies Result;
});
