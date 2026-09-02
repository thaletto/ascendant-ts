import { Schema } from "effect";

import {
  Division,
  Houses,
  PlanetDignity,
  Planets,
  PlanetsLagna,
  Rashis,
  RashiLords,
} from "../chart/model.js";
import { YogaProvenance } from "../provenance.js";

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

export const BodyDignityObservation = Schema.Struct({
  body: Planets,
  relativeHouse: Houses,
  dignities: Schema.Array(PlanetDignity),
});
export interface BodyDignityObservation extends Schema.Schema.Type<typeof BodyDignityObservation> {}

export const HouseOccupancyObservation = Schema.Struct({
  relativeHouse: Houses,
  occupants: Schema.Array(Planets),
});
export interface HouseOccupancyObservation extends Schema.Schema.Type<
  typeof HouseOccupancyObservation
> {}

export const HouseLordPlacementObservation = Schema.Struct({
  lordOfHouse: Houses,
  lord: RashiLords,
  observedRelativeHouse: Houses,
});
export interface HouseLordPlacementObservation extends Schema.Schema.Type<
  typeof HouseLordPlacementObservation
> {}

export const HouseLordPlacementEvidence = Schema.TaggedStruct("HouseLordPlacementEvidence", {
  division: Division,
  referenceBody: PlanetsLagna,
  lordOfHouse: Houses,
  expectedRelativeHouses: Schema.Array(Houses),
  observed: HouseLordPlacementObservation,
  matched: Schema.Boolean,
});
export interface HouseLordPlacementEvidence extends Schema.Schema.Type<
  typeof HouseLordPlacementEvidence
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

export const BodyDignitiesEvidence = Schema.TaggedStruct("BodyDignitiesEvidence", {
  division: Division,
  referenceBody: PlanetsLagna,
  bodies: Schema.Array(Planets),
  expectedRelativeHouses: Schema.Array(Houses),
  expectedDignities: Schema.Array(PlanetDignity),
  observed: Schema.Array(BodyDignityObservation),
  quantifier: Schema.Literal("All"),
  matched: Schema.Boolean,
});
export interface BodyDignitiesEvidence extends Schema.Schema.Type<typeof BodyDignitiesEvidence> {}

export const BodySignObservation = Schema.Struct({
  body: Planets,
  sign: Rashis,
});
export interface BodySignObservation extends Schema.Schema.Type<typeof BodySignObservation> {}

export const NaturalPlanetGroup = Schema.Literal("NaturalMalefics");
export type NaturalPlanetGroup = typeof NaturalPlanetGroup.Type;

export const NaturalPlanetGroupPositionsEvidence = Schema.TaggedStruct(
  "NaturalPlanetGroupPositionsEvidence",
  {
    division: Division,
    referenceBody: PlanetsLagna,
    group: NaturalPlanetGroup,
    bodies: Schema.Array(Planets),
    expectedRelativeHouses: Schema.Array(Houses),
    observed: Schema.Array(BodyPositionObservation),
    quantifier: Schema.Literals(["All", "Any"] as const),
    matched: Schema.Boolean,
  },
);
export interface NaturalPlanetGroupPositionsEvidence extends Schema.Schema.Type<
  typeof NaturalPlanetGroupPositionsEvidence
> {}

export const ContinuousSignWindowEvidence = Schema.TaggedStruct("ContinuousSignWindowEvidence", {
  division: Division,
  referenceBody: PlanetsLagna,
  bodies: Schema.Array(Planets),
  startingRelativeHouse: Houses,
  signCount: Schema.Finite,
  expectedSigns: Schema.Array(Rashis),
  observed: Schema.Array(BodySignObservation),
  matched: Schema.Boolean,
});
export interface ContinuousSignWindowEvidence extends Schema.Schema.Type<
  typeof ContinuousSignWindowEvidence
> {}

export const SignModality = Schema.Literals(["Movable", "Fixed", "Dual"] as const);
export type SignModality = typeof SignModality.Type;

export const SignModalityObservation = Schema.Struct({
  body: Planets,
  sign: Rashis,
  modality: SignModality,
});
export interface SignModalityObservation extends Schema.Schema.Type<
  typeof SignModalityObservation
> {}

export const SignModalityEvidence = Schema.TaggedStruct("SignModalityEvidence", {
  division: Division,
  bodies: Schema.Array(Planets),
  expectedModality: SignModality,
  observed: Schema.Array(SignModalityObservation),
  matched: Schema.Boolean,
});
export interface SignModalityEvidence extends Schema.Schema.Type<typeof SignModalityEvidence> {}

export const OccupiedSignCountEvidence = Schema.TaggedStruct("OccupiedSignCountEvidence", {
  division: Division,
  bodies: Schema.Array(Planets),
  expectedSignCount: Schema.Finite,
  observed: Schema.Array(BodySignObservation),
  observedSignCount: Schema.Finite,
  matched: Schema.Boolean,
});
export interface OccupiedSignCountEvidence extends Schema.Schema.Type<
  typeof OccupiedSignCountEvidence
> {}

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
  | BodyDignitiesEvidence
  | NaturalPlanetGroupPositionsEvidence
  | ContinuousSignWindowEvidence
  | SignModalityEvidence
  | OccupiedSignCountEvidence
  | HouseOccupancyEvidence
  | HouseLordPlacementEvidence
  | AllEvidence
  | AnyEvidence
  | NotEvidence;

const YogaEvidenceRef = Schema.suspend((): Schema.Codec<YogaEvidence> => YogaEvidence);

export const YogaEvidence: Schema.Codec<YogaEvidence> = Schema.Union([
  BodyPositionsEvidence,
  BodyDignitiesEvidence,
  NaturalPlanetGroupPositionsEvidence,
  ContinuousSignWindowEvidence,
  SignModalityEvidence,
  OccupiedSignCountEvidence,
  HouseOccupancyEvidence,
  HouseLordPlacementEvidence,
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
  provenance: YogaProvenance,
  results: Schema.Array(YogaResult),
});
export interface YogaEvaluation extends Schema.Schema.Type<typeof YogaEvaluation> {}

export const YogaSelection = Schema.NonEmptyArray(Schema.String);
export type YogaSelection = typeof YogaSelection.Type;
