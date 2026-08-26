import { Data, type Effect, type Result, Schema } from "effect";

import type { Division, Houses, Planets, PlanetsLagna } from "../chart/model.js";
import type { InvalidYogaEvidenceError } from "./error.js";
import type { YogaDescriptor, YogaEvidence } from "./model.js";

export type YogaCondition = Data.TaggedEnum<{
  BodyPositionsCondition: {
    readonly division: Division;
    readonly referenceBody: PlanetsLagna;
    readonly bodies: readonly Planets[];
    readonly expectedRelativeHouses: readonly Houses[];
    readonly quantifier: "All" | "Any";
  };
  HouseOccupancyCondition: {
    readonly division: Division;
    readonly referenceBody: PlanetsLagna;
    readonly expectedRelativeHouses: readonly Houses[];
    readonly excludedBodies: readonly Planets[];
    readonly quantifier: "EveryHouse" | "AnyHouse";
  };
  AllCondition: { readonly children: readonly YogaCondition[] };
  AnyCondition: { readonly children: readonly YogaCondition[] };
  NotCondition: { readonly child: YogaCondition };
}>;

export const YogaCondition = Data.taggedEnum<YogaCondition>();

export interface IndexedDivision {
  readonly positionOf: (body: PlanetsLagna) => Houses;
  readonly occupantsAtRelativeHouse: (
    referenceBody: PlanetsLagna,
    relativeHouse: Houses,
  ) => readonly Planets[];
}

export interface EvaluationIndex {
  readonly forDivision: (
    division: Division,
  ) => Result.Result<IndexedDivision, InvalidYogaEvidenceError>;
}

export type YogaStrategy = Data.TaggedEnum<{
  Condition: { readonly condition: YogaCondition };
  Evaluator: {
    readonly name: Schema.String;
    readonly evaluate: (index: EvaluationIndex) => Effect.Effect<YogaEvidence>;
  };
}>;

export const YogaStrategy = Data.taggedEnum<YogaStrategy>();

export interface YogaDefinition {
  readonly yoga: YogaDescriptor;
  readonly requiredDivisions: readonly [Division, ...Division[]];
  readonly strategy: YogaStrategy;
}
