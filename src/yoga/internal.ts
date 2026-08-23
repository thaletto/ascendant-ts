import type { Effect } from "effect";
import type { Division, Houses, Planets, PlanetsLagna } from "../chart/model.js";
import type { YogaDescriptor, YogaEvidence, YogaId } from "./model.js";

export interface BodyPositionsCondition {
  readonly _tag: "BodyPositionsCondition";
  readonly division: typeof Division.Type;
  readonly referenceBody: typeof PlanetsLagna.Type;
  readonly bodies: readonly (typeof Planets.Type)[];
  readonly expectedRelativeHouses: readonly (typeof Houses.Type)[];
  readonly quantifier: "All" | "Any";
}

export interface HouseOccupancyCondition {
  readonly _tag: "HouseOccupancyCondition";
  readonly division: typeof Division.Type;
  readonly referenceBody: typeof PlanetsLagna.Type;
  readonly expectedRelativeHouses: readonly (typeof Houses.Type)[];
  readonly excludedBodies: readonly (typeof Planets.Type)[];
  readonly quantifier: "EveryHouse" | "AnyHouse";
}

export interface AllCondition {
  readonly _tag: "AllCondition";
  readonly children: readonly YogaCondition[];
}

export interface AnyCondition {
  readonly _tag: "AnyCondition";
  readonly children: readonly YogaCondition[];
}

export interface NotCondition {
  readonly _tag: "NotCondition";
  readonly child: YogaCondition;
}

export type YogaCondition =
  | BodyPositionsCondition
  | HouseOccupancyCondition
  | AllCondition
  | AnyCondition
  | NotCondition;

export interface EvaluationIndex {
  readonly positionOf: (
    division: typeof Division.Type,
    body: typeof PlanetsLagna.Type,
  ) => typeof Houses.Type;
  readonly occupantsAtRelativeHouse: (
    division: typeof Division.Type,
    referenceBody: typeof PlanetsLagna.Type,
    relativeHouse: typeof Houses.Type,
  ) => readonly (typeof Planets.Type)[];
}

export interface YogaDefinition {
  readonly yoga: YogaDescriptor;
  readonly requiredDivisions: readonly [typeof Division.Type, ...(typeof Division.Type)[]];
  readonly condition?: YogaCondition;
  readonly evaluator?: {
    readonly name: string;
    readonly evaluate: (index: EvaluationIndex) => YogaEvidence;
  };
  readonly sources: readonly string[];
}

export interface EvaluationHooks {
  readonly onStart: (id: YogaId) => Effect.Effect<void>;
  readonly onFinish: (id: YogaId) => Effect.Effect<void>;
}

export interface ServiceOptions {
  readonly hooks?: EvaluationHooks;
  readonly concurrency?: number;
}
