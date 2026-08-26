import { Schema } from "effect";

import { Division, Houses, Planets, PlanetsLagna, Provenance } from "../internal/model.js";

export const YogaId = Schema.String.check(Schema.isPattern(/^[a-z][a-z0-9_]*$/)).pipe(
  Schema.brand("YogaId"),
);
export type YogaId = typeof YogaId.Type;
export const YogaIds = YogaId;

export const YogaClassifications = Schema.Literals(["Positive", "Negative", "Neutral"] as const);
export type YogaClassification = typeof YogaClassifications.Type;

export const YogaDescriptor = Schema.Struct({
  id: YogaIds,
  name: Schema.String,
  aliases: Schema.Array(Schema.String),
  classification: YogaClassifications,
  description: Schema.String,
});
export interface YogaDescriptor extends Schema.Schema.Type<typeof YogaDescriptor> {}

export const BodyPositionObservation = Schema.Struct({
  body: Planets,
  relativeHouse: Houses,
});
export interface BodyPositionObservation extends Schema.Schema.Type<
  typeof BodyPositionObservation
> {}

export const HouseOccupancyObservation = Schema.Struct({
  relativeHouse: Houses,
  occupants: Schema.Array(Planets),
});
export interface HouseOccupancyObservation extends Schema.Schema.Type<
  typeof HouseOccupancyObservation
> {}

export const BodyPositionsEvidence = Schema.TaggedStruct("BodyPositionsEvidence", {
  division: Division,
  referenceBody: PlanetsLagna,
  bodies: Schema.Array(Planets),
  expectedRelativeHouses: Schema.Array(Houses),
  observed: Schema.Array(BodyPositionObservation),
  quantifier: Schema.Literals(["All", "Any"] as const),
  matched: Schema.Boolean,
});
export interface BodyPositionsEvidence extends Schema.Schema.Type<typeof BodyPositionsEvidence> {}

export const HouseOccupancyEvidence = Schema.TaggedStruct("HouseOccupancyEvidence", {
  division: Division,
  referenceBody: PlanetsLagna,
  expectedRelativeHouses: Schema.Array(Houses),
  observed: Schema.Array(HouseOccupancyObservation),
  excludedBodies: Schema.Array(Planets),
  quantifier: Schema.Literals(["EveryHouse", "AnyHouse"] as const),
  matched: Schema.Boolean,
});
export interface HouseOccupancyEvidence extends Schema.Schema.Type<typeof HouseOccupancyEvidence> {}

export interface AllEvidence {
  readonly _tag: "AllEvidence";
  readonly children: readonly YogaEvidence[];
  readonly matched: boolean;
}

export interface AnyEvidence {
  readonly _tag: "AnyEvidence";
  readonly children: readonly YogaEvidence[];
  readonly matched: boolean;
}

export interface NotEvidence {
  readonly _tag: "NotEvidence";
  readonly child: YogaEvidence;
  readonly matched: boolean;
}

export type YogaEvidence =
  | BodyPositionsEvidence
  | HouseOccupancyEvidence
  | AllEvidence
  | AnyEvidence
  | NotEvidence;

const YogaEvidenceRef = Schema.suspend((): Schema.Codec<YogaEvidence> => YogaEvidence);

export const YogaEvidence: Schema.Codec<YogaEvidence> = Schema.Union([
  BodyPositionsEvidence,
  HouseOccupancyEvidence,
  Schema.TaggedStruct("AllEvidence", {
    children: Schema.Array(YogaEvidenceRef),
    matched: Schema.Boolean,
  }),
  Schema.TaggedStruct("AnyEvidence", {
    children: Schema.Array(YogaEvidenceRef),
    matched: Schema.Boolean,
  }),
  Schema.TaggedStruct("NotEvidence", {
    child: YogaEvidenceRef,
    matched: Schema.Boolean,
  }),
]);

export const YogaResult = Schema.Struct({
  yoga: YogaDescriptor,
  present: Schema.Boolean,
  evidence: YogaEvidence,
});
export interface YogaResult extends Schema.Schema.Type<typeof YogaResult> {}

export const YogaEvaluation = Schema.Struct({
  provenance: Provenance,
  results: Schema.Array(YogaResult),
});
export interface YogaEvaluation extends Schema.Schema.Type<typeof YogaEvaluation> {}

export const YogaSelection = Schema.NonEmptyArray(Schema.String);
export type YogaSelection = typeof YogaSelection.Type;
