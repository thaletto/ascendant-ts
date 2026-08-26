import { Schema } from "effect";

import { Degree } from "../../chart/model.js";

export const ClassicalPlanets = Schema.Literals([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
] as const);
export type ClassicalPlanets = typeof ClassicalPlanets.Type;

export const Roles = Schema.Literals([
  "Atmakaraka",
  "Amatyakaraka",
  "Bhratrikaraka",
  "Matrikaraka",
  "Putrakaraka",
  "Gnatikaraka",
  "Darakaraka",
] as const);
export type Role = typeof Roles.Type;

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("exact-degree-shared-roles"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Holder = Schema.Struct({
  planet: ClassicalPlanets,
  degree: Degree,
});
export interface Holder extends Schema.Schema.Type<typeof Holder> {}

export interface ExactDegree {
  readonly coefficient: bigint;
  readonly scale: number;
  readonly value: Degree;
}

export interface RankedHolder extends Holder {
  readonly exactDegree: ExactDegree;
}

export const Assignments = Schema.Record(Roles, Schema.NonEmptyArray(Holder));
export interface Assignments extends Schema.Schema.Type<typeof Assignments> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  assignments: Assignments,
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()(
  "CharaKarakasEvidenceError",
  {
    placement: ClassicalPlanets,
    expected: Schema.Literal(1),
    actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  },
) {}

export class ParseError extends Schema.TaggedError<ParseError>()("CharaKarakasParseError", {
  message: Schema.String,
}) {}
