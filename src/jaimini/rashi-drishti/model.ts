import { Schema } from "effect";

import { Rashis } from "../../internal/model.js";

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
