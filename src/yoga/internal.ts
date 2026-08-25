import { Data, type Effect, type Result } from "effect";

import type { Division, Houses, Planets, PlanetsLagna } from "../chart/model.js";
import type { InvalidYogaEvidenceError } from "./error.js";
import type { YogaDescriptor, YogaEvidence, YogaId } from "./model.js";

export type YogaCondition = Data.TaggedEnum<{
  BodyPositionsCondition: {
    readonly division: typeof Division.Type;
    readonly referenceBody: typeof PlanetsLagna.Type;
    readonly bodies: readonly (typeof Planets.Type)[];
    readonly expectedRelativeHouses: readonly (typeof Houses.Type)[];
    readonly quantifier: "All" | "Any";
  };
  HouseOccupancyCondition: {
    readonly division: typeof Division.Type;
    readonly referenceBody: typeof PlanetsLagna.Type;
    readonly expectedRelativeHouses: readonly (typeof Houses.Type)[];
    readonly excludedBodies: readonly (typeof Planets.Type)[];
    readonly quantifier: "EveryHouse" | "AnyHouse";
  };
  AllCondition: { readonly children: readonly YogaCondition[] };
  AnyCondition: { readonly children: readonly YogaCondition[] };
  NotCondition: { readonly child: YogaCondition };
}>;

export const YogaCondition = Data.taggedEnum<YogaCondition>();

export interface IndexedDivision {
  readonly positionOf: (body: typeof PlanetsLagna.Type) => typeof Houses.Type;
  readonly occupantsAtRelativeHouse: (
    referenceBody: typeof PlanetsLagna.Type,
    relativeHouse: typeof Houses.Type,
  ) => readonly (typeof Planets.Type)[];
}

export interface EvaluationIndex {
  readonly forDivision: (
    division: typeof Division.Type,
  ) => Result.Result<IndexedDivision, InvalidYogaEvidenceError>;
}

export type YogaStrategy = Data.TaggedEnum<{
  Condition: { readonly condition: YogaCondition };
  Evaluator: {
    readonly name: string;
    readonly evaluate: (index: EvaluationIndex) => Effect.Effect<YogaEvidence>;
  };
}>;

export const YogaStrategy = Data.taggedEnum<YogaStrategy>();

export interface YogaDefinition {
  readonly yoga: YogaDescriptor;
  readonly requiredDivisions: readonly [typeof Division.Type, ...(typeof Division.Type)[]];
  readonly strategy: YogaStrategy;
}

export interface EvaluationHooks {
  readonly onStart: (id: YogaId) => Effect.Effect<void>;
  readonly onFinish: (id: YogaId) => Effect.Effect<void>;
}

export interface ServiceOptions {
  readonly hooks?: EvaluationHooks;
  readonly concurrency?: number;
}
