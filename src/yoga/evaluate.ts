import { Schema } from "effect";
import {
  Houses,
  type Chart,
  type ChartCalculation,
  type Division,
  type Planets,
  type PlanetsLagna,
} from "../chart/model.js";
import type { EvaluationIndex, YogaCondition, YogaDefinition } from "./internal.js";
import type { YogaEvidence, YogaResult } from "./model.js";

function normalizeHouse(value: number): typeof Houses.Type {
  return Schema.decodeUnknownSync(Houses)(((((value - 1) % 12) + 12) % 12) + 1);
}

export function makeEvaluationIndex(calculation: ChartCalculation): EvaluationIndex {
  const charts = new Map<typeof Division.Type, Chart>();
  const positions = new Map<string, typeof Houses.Type>();
  const occupants = new Map<string, readonly (typeof Planets.Type)[]>();

  for (const chart of calculation.charts) {
    if (charts.has(chart.division)) {
      throw new Error(`Duplicate D${chart.division} Chart in Yoga evaluation input`);
    }
    charts.set(chart.division, chart);

    let lagnaHouse: typeof Houses.Type | undefined;
    for (const [houseText, house] of Object.entries(chart.houses)) {
      const houseNumber = Schema.decodeUnknownSync(Houses)(Number(houseText));
      if (house.lagna !== null) {
        if (lagnaHouse !== undefined) {
          throw new Error(`Multiple Lagna positions in D${chart.division}`);
        }
        lagnaHouse = houseNumber;
      }
      for (const planet of house.planets) {
        const key = `${chart.division}:${planet.name}`;
        if (positions.has(key)) {
          throw new Error(`Duplicate ${planet.name} position in D${chart.division}`);
        }
        positions.set(key, houseNumber);
      }
      occupants.set(
        `${chart.division}:${houseNumber}`,
        Object.freeze(house.planets.map((planet) => planet.name)),
      );
    }
    if (lagnaHouse === undefined) {
      throw new Error(`Missing Lagna position in D${chart.division}`);
    }
    positions.set(`${chart.division}:Lagna`, lagnaHouse);
  }

  const chartFor = (division: typeof Division.Type): Chart => {
    const chart = charts.get(division);
    if (chart === undefined) throw new Error(`Missing preflighted D${division} Chart`);
    return chart;
  };

  const positionOf = (
    division: typeof Division.Type,
    body: typeof PlanetsLagna.Type,
  ): typeof Houses.Type => {
    const house = positions.get(`${division}:${body}`);
    if (house === undefined) throw new Error(`Missing ${body} position in D${division}`);
    return house;
  };

  return Object.freeze({
    positionOf,
    occupantsAtRelativeHouse: (
      division: typeof Division.Type,
      referenceBody: typeof PlanetsLagna.Type,
      relativeHouse: typeof Houses.Type,
    ) => {
      const referenceHouse = positionOf(division, referenceBody);
      const absoluteHouse = normalizeHouse(referenceHouse + relativeHouse - 1);
      chartFor(division);
      const bodies = occupants.get(`${division}:${absoluteHouse}`);
      if (bodies === undefined) {
        throw new Error(`Missing house ${absoluteHouse} occupants in D${division}`);
      }
      return bodies;
    },
  });
}

export function evaluateCondition(condition: YogaCondition, index: EvaluationIndex): YogaEvidence {
  switch (condition._tag) {
    case "BodyPositionsCondition": {
      const referenceHouse = index.positionOf(condition.division, condition.referenceBody);
      const observed = condition.bodies.map((body) => ({
        body,
        relativeHouse: normalizeHouse(
          index.positionOf(condition.division, body) - referenceHouse + 1,
        ),
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
      const observed = condition.expectedRelativeHouses.map((relativeHouse) => ({
        relativeHouse,
        occupants: index.occupantsAtRelativeHouse(
          condition.division,
          condition.referenceBody,
          relativeHouse,
        ),
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
      const children = condition.children.map((child) => evaluateCondition(child, index));
      return { _tag: "AllEvidence", children, matched: children.every(({ matched }) => matched) };
    }
    case "AnyCondition": {
      const children = condition.children.map((child) => evaluateCondition(child, index));
      return { _tag: "AnyEvidence", children, matched: children.some(({ matched }) => matched) };
    }
    case "NotCondition": {
      const child = evaluateCondition(condition.child, index);
      return { _tag: "NotEvidence", child, matched: !child.matched };
    }
  }
}

export function evaluateDefinition(definition: YogaDefinition, index: EvaluationIndex): YogaResult {
  if ((definition.condition === undefined) === (definition.evaluator === undefined)) {
    throw new Error(`Yoga ${definition.yoga.id} must define exactly one evaluation strategy`);
  }
  let evidence: YogaEvidence;
  if (definition.condition !== undefined) {
    evidence = evaluateCondition(definition.condition, index);
  } else {
    const evaluator = definition.evaluator;
    if (evaluator === undefined) {
      throw new Error(`Yoga ${definition.yoga.id} is missing its evaluation strategy`);
    }
    evidence = evaluator.evaluate(index);
  }
  if (typeof evidence.matched !== "boolean") {
    throw new Error(`Yoga ${definition.yoga.id} evaluator returned invalid evidence`);
  }
  return { yoga: definition.yoga, present: evidence.matched, evidence };
}
