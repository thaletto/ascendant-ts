import { Effect, Result, Schema } from "effect";
import {
  Houses,
  type Chart,
  type ChartCalculation,
  type Division,
  type Planets,
  type PlanetsLagna,
} from "../chart/model.js";
import { InvalidYogaEvidenceError } from "./error.js";
import {
  YogaStrategy,
  type EvaluationIndex,
  type IndexedDivision,
  type YogaCondition,
  type YogaDefinition,
} from "./internal.js";
import type { YogaEvidence, YogaResult } from "./model.js";

function normalizeHouse(value: number): typeof Houses.Type {
  return Schema.decodeUnknownSync(Houses)(((((value - 1) % 12) + 12) % 12) + 1);
}

function failure(message: string): Result.Result<IndexedDivision, InvalidYogaEvidenceError> {
  return Result.fail(new InvalidYogaEvidenceError({ message, cause: new Error(message) }));
}

export function makeEvaluationIndex(calculation: ChartCalculation): EvaluationIndex {
  const cache = new Map<
    typeof Division.Type,
    Result.Result<IndexedDivision, InvalidYogaEvidenceError>
  >();

  const buildDivision = (
    division: typeof Division.Type,
  ): Result.Result<IndexedDivision, InvalidYogaEvidenceError> => {
    let chart: Chart | undefined;
    for (const candidate of calculation.charts) {
      if (candidate.division !== division) continue;
      if (chart !== undefined) {
        return failure(`Duplicate D${division} Chart in Yoga evaluation input`);
      }
      chart = candidate;
    }
    if (chart === undefined) {
      return failure(`Missing D${division} Chart in Yoga evaluation input`);
    }

    const positions = new Map<string, typeof Houses.Type>();
    const occupants = new Map<typeof Houses.Type, readonly (typeof Planets.Type)[]>();
    let lagnaHouse: typeof Houses.Type | undefined;
    for (const [houseText, house] of Object.entries(chart.houses)) {
      const houseNumber = Schema.decodeUnknownSync(Houses)(Number(houseText));
      if (house.lagna !== null) {
        if (lagnaHouse !== undefined) {
          return failure(`Multiple Lagna positions in D${division}`);
        }
        lagnaHouse = houseNumber;
      }
      for (const planet of house.planets) {
        if (positions.has(planet.name)) {
          return failure(`Duplicate ${planet.name} position in D${division}`);
        }
        positions.set(planet.name, houseNumber);
      }
      occupants.set(houseNumber, Object.freeze(house.planets.map((planet) => planet.name)));
    }
    if (lagnaHouse === undefined) {
      return failure(`Missing Lagna position in D${division}`);
    }
    positions.set("Lagna", lagnaHouse);

    const indexed: IndexedDivision = Object.freeze({
      positionOf: (body: typeof PlanetsLagna.Type): typeof Houses.Type => {
        const house = positions.get(body);
        if (house === undefined) throw new Error(`Missing ${body} position in D${division}`);
        return house;
      },
      occupantsAtRelativeHouse: (
        referenceBody: typeof PlanetsLagna.Type,
        relativeHouse: typeof Houses.Type,
      ): readonly (typeof Planets.Type)[] => {
        const referenceHouse = indexed.positionOf(referenceBody);
        const absoluteHouse = normalizeHouse(referenceHouse + relativeHouse - 1);
        const bodies = occupants.get(absoluteHouse);
        if (bodies === undefined) {
          throw new Error(`Missing house ${absoluteHouse} occupants in D${division}`);
        }
        return bodies;
      },
    });
    return Result.succeed(indexed);
  };

  return Object.freeze({
    forDivision: (division: typeof Division.Type) => {
      const cached = cache.get(division);
      if (cached !== undefined) return cached;
      const built = buildDivision(division);
      cache.set(division, built);
      return built;
    },
  });
}

function requireDivision(
  index: EvaluationIndex,
  division: typeof Division.Type,
): Effect.Effect<IndexedDivision, InvalidYogaEvidenceError> {
  return Effect.suspend(() => {
    const result = index.forDivision(division);
    return Result.isSuccess(result) ? Effect.succeed(result.success) : Effect.fail(result.failure);
  });
}

export const evaluateCondition = Effect.fn("Yoga.evaluateCondition")(function* (
  condition: YogaCondition,
  index: EvaluationIndex,
): Effect.fn.Return<YogaEvidence, InvalidYogaEvidenceError> {
  switch (condition._tag) {
    case "BodyPositionsCondition": {
      const at = yield* requireDivision(index, condition.division);
      const referenceHouse = at.positionOf(condition.referenceBody);
      const observed = condition.bodies.map((body) => ({
        body,
        relativeHouse: normalizeHouse(at.positionOf(body) - referenceHouse + 1),
      }));
      const matches = observed.map(({ relativeHouse }) =>
        condition.expectedRelativeHouses.includes(relativeHouse),
      );
      return {
        _tag: "BodyPositionsEvidence",
        division: condition.division,
        referenceBody: condition.referenceBody,
        bodies: condition.bodies,
        expectedRelativeHouses: condition.expectedRelativeHouses,
        observed,
        quantifier: condition.quantifier,
        matched: condition.quantifier === "All" ? matches.every(Boolean) : matches.some(Boolean),
      };
    }
    case "HouseOccupancyCondition": {
      const at = yield* requireDivision(index, condition.division);
      const observed = condition.expectedRelativeHouses.map((relativeHouse) => ({
        relativeHouse,
        occupants: at.occupantsAtRelativeHouse(condition.referenceBody, relativeHouse),
      }));
      const occupied = observed.map(({ occupants }) =>
        occupants.some((body) => !condition.excludedBodies.includes(body)),
      );
      return {
        _tag: "HouseOccupancyEvidence",
        division: condition.division,
        referenceBody: condition.referenceBody,
        expectedRelativeHouses: condition.expectedRelativeHouses,
        observed,
        excludedBodies: condition.excludedBodies,
        quantifier: condition.quantifier,
        matched:
          condition.quantifier === "EveryHouse" ? occupied.every(Boolean) : occupied.some(Boolean),
      };
    }
    case "AllCondition": {
      const children = [];
      for (const child of condition.children) {
        children.push(yield* evaluateCondition(child, index));
      }
      return { _tag: "AllEvidence", children, matched: children.every(({ matched }) => matched) };
    }
    case "AnyCondition": {
      const children = [];
      for (const child of condition.children) {
        children.push(yield* evaluateCondition(child, index));
      }
      return { _tag: "AnyEvidence", children, matched: children.some(({ matched }) => matched) };
    }
    case "NotCondition": {
      const child = yield* evaluateCondition(condition.child, index);
      return { _tag: "NotEvidence", child, matched: !child.matched };
    }
  }
});

export const evaluateDefinition = Effect.fn("Yoga.evaluateDefinition")(function* (
  definition: YogaDefinition,
  index: EvaluationIndex,
): Effect.fn.Return<YogaResult, InvalidYogaEvidenceError> {
  const evidence = yield* YogaStrategy.$match(definition.strategy, {
    Condition: ({ condition }) => evaluateCondition(condition, index),
    Evaluator: ({ evaluate }) => evaluate(index),
  });
  if (typeof evidence.matched !== "boolean") {
    return yield* new InvalidYogaEvidenceError({
      message: `Yoga ${definition.yoga.id} evaluator returned invalid evidence`,
      cause: new Error(`Yoga ${definition.yoga.id} evaluator returned invalid evidence`),
    });
  }
  return { yoga: definition.yoga, present: evidence.matched, evidence };
});
