import { Effect } from "effect";

import type { Rashis } from "../../internal/model.js";
import { targetsOf } from "./helper.js";
import type { Result } from "./model.js";
import { Provenance } from "./model.js";

export const calculate = Effect.fn("RashiDrishti.calculate")((reference: Rashis) =>
  Effect.sync(() => {
    const targets = targetsOf(reference);

    return {
      provenance: {
        school: "Jaimini" as const,
        method: "movable-fixed-dual" as const,
        version: 1 as const,
      } satisfies Provenance,
      reference,
      targets,
    } satisfies Result;
  }),
);
