import { Effect } from "effect";

import type { Rashis } from "../../chart/model.js";
import { methods } from "../../provenance.js";
import { targetsOf } from "./helper.js";
import type { Result } from "./model.js";

/**
 * Derives the three Jaimini Rashi Drishti targets for one reference sign using
 * movable/fixed/dual modality rules, not planetary degree aspects or orbs.
 */
export const calculate = Effect.fn("RashiDrishti.calculate")((reference: Rashis) =>
  Effect.sync(() => {
    const targets = targetsOf(reference);

    return {
      provenance: methods.jaiminiRashiDrishti.provenance,
      reference,
      targets,
    } satisfies Result;
  }),
);
