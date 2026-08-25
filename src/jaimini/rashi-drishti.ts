import { Context, Effect, Layer, Schema } from "effect";

import { RASHI_NAMES } from "../chart/literals.js";
import { Rashis } from "../chart/model.js";
import { signAt } from "../internal/helper.js";

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("movable-fixed-dual"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  reference: Rashis,
  targets: Schema.Tuple([Rashis, Rashis, Rashis]),
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

const MOVABLE = new Set<typeof Rashis.Type>(["Aries", "Cancer", "Libra", "Capricorn"]);
const FIXED = new Set<typeof Rashis.Type>(["Taurus", "Leo", "Scorpio", "Aquarius"]);
const DUAL = new Set<typeof Rashis.Type>(["Gemini", "Virgo", "Sagittarius", "Pisces"]);

export const calculate = Effect.fn("RashiDrishti.calculate")((reference: typeof Rashis.Type) =>
  Effect.sync(() => {
    const referenceIndex = RASHI_NAMES.indexOf(reference);
    const targets = RASHI_NAMES.filter((candidate) => {
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

    return {
      provenance: {
        school: "Jaimini" as const,
        method: "movable-fixed-dual" as const,
        version: 1 as const,
      },
      reference,
      targets: [first, second, third],
    } satisfies Result;
  }),
);

export interface Service {
  readonly calculate: (reference: typeof Rashis.Type) => Effect.Effect<Result>;
}

export const Service = Context.Service<Service>("astro-ascendant/rashi-drishti/Service");

export const layer = Layer.succeed(Service, Service.of({ calculate }));
