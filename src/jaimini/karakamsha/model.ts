import { Schema } from "effect";

import { Rashis } from "../../internal/model.js";
import * as CharaKarakas from "../chara-karakas/index.js";

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("atmakaraka-d9-sign"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Placement = Schema.Struct({
  planet: CharaKarakas.ClassicalPlanets,
  sign: Rashis,
});
export interface Placement extends Schema.Schema.Type<typeof Placement> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  placements: Schema.NonEmptyArray(Placement),
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()("KarakamshaEvidenceError", {
  placement: CharaKarakas.ClassicalPlanets,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

export class CalculationError extends Schema.TaggedError<CalculationError>()(
  "KarakamshaCalculationError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}
