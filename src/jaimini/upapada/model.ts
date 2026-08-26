import { Schema } from "effect";

import { RashiLords, Rashis } from "../../chart/model.js";

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("twelfth-house-plain-projection"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  house: Schema.Literal(12),
  sourceSign: Rashis,
  lord: RashiLords,
  lordSign: Rashis,
  sign: Rashis,
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()("UpapadaEvidenceError", {
  placement: RashiLords,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}
