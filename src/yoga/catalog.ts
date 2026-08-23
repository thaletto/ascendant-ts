import { Schema } from "effect";
import { Division } from "../chart/model.js";
import type { YogaCondition, YogaDefinition } from "./internal.js";
import { housePatternDefinitions } from "./definitions/house-patterns.js";
import { moonRelativeDefinitions } from "./definitions/moon-relative.js";

function normalizedAlias(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function conditionDivisions(condition: YogaCondition): readonly (typeof Division.Type)[] {
  switch (condition._tag) {
    case "BodyPositionsCondition":
    case "HouseOccupancyCondition":
      return [condition.division];
    case "AllCondition":
    case "AnyCondition":
      return condition.children.flatMap(conditionDivisions);
    case "NotCondition":
      return conditionDivisions(condition.child);
  }
}

function freezeCondition(condition: YogaCondition): YogaCondition {
  switch (condition._tag) {
    case "BodyPositionsCondition":
      return Object.freeze({
        ...condition,
        bodies: Object.freeze([...condition.bodies]),
        expectedRelativeHouses: Object.freeze([...condition.expectedRelativeHouses]),
      });
    case "HouseOccupancyCondition":
      return Object.freeze({
        ...condition,
        expectedRelativeHouses: Object.freeze([...condition.expectedRelativeHouses]),
        excludedBodies: Object.freeze([...condition.excludedBodies]),
      });
    case "AllCondition":
    case "AnyCondition":
      return Object.freeze({
        ...condition,
        children: Object.freeze(condition.children.map(freezeCondition)),
      });
    case "NotCondition":
      return Object.freeze({ ...condition, child: freezeCondition(condition.child) });
  }
}

function freezeDefinition(definition: YogaDefinition): YogaDefinition {
  const [firstDivision, ...otherDivisions] = definition.requiredDivisions;
  const { aliases, classification, description, id, name } = definition.yoga;
  const common = {
    ...definition,
    yoga: Object.freeze({
      id,
      name,
      aliases: Object.freeze([...aliases]),
      classification,
      description,
    }),
    requiredDivisions: Object.freeze([firstDivision, ...otherDivisions] as const),
    sources: Object.freeze([...definition.sources]),
  };
  if (definition.condition !== undefined) {
    return Object.freeze({ ...common, condition: freezeCondition(definition.condition) });
  }
  const evaluator = definition.evaluator;
  if (evaluator === undefined) {
    throw new Error(`Yoga ${definition.yoga.id} has no evaluation strategy`);
  }
  return Object.freeze({ ...common, evaluator: Object.freeze(evaluator) });
}

export function makeCatalog(definitions: readonly YogaDefinition[]): readonly YogaDefinition[] {
  const ids = new Set<string>();
  const aliases = new Set<string>();
  for (const definition of definitions) {
    if (ids.has(definition.yoga.id)) {
      throw new Error(`Duplicate Yoga ID: ${definition.yoga.id}`);
    }
    ids.add(definition.yoga.id);
    if (definition.requiredDivisions.length === 0) {
      throw new Error(`Yoga ${definition.yoga.id} has no required Divisions`);
    }
    const requiredDivisions = new Set<typeof Division.Type>();
    for (const division of definition.requiredDivisions) {
      if (!Schema.is(Division)(division) || requiredDivisions.has(division)) {
        throw new Error(`Yoga ${definition.yoga.id} has invalid required Divisions`);
      }
      requiredDivisions.add(division);
    }
    if ((definition.condition === undefined) === (definition.evaluator === undefined)) {
      throw new Error(`Yoga ${definition.yoga.id} must define exactly one evaluation strategy`);
    }
    if (definition.condition !== undefined) {
      const usedDivisions = new Set(conditionDivisions(definition.condition));
      if (
        [...usedDivisions].some((division) => !requiredDivisions.has(division)) ||
        [...requiredDivisions].some((division) => !usedDivisions.has(division))
      ) {
        throw new Error(`Yoga ${definition.yoga.id} condition and required Divisions disagree`);
      }
    }
    for (const alias of definition.yoga.aliases) {
      const key = normalizedAlias(alias);
      if (key.length === 0 || aliases.has(key)) {
        throw new Error(`Duplicate or empty Yoga alias: ${alias}`);
      }
      aliases.add(key);
    }
  }
  return Object.freeze(definitions.map(freezeDefinition));
}

export const definitions = makeCatalog([...moonRelativeDefinitions, ...housePatternDefinitions]);

export const catalog = Object.freeze(definitions.map(({ yoga }) => yoga));
