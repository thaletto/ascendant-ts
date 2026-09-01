import { Array, Effect, HashSet, MutableHashSet, Schema } from "effect";

import { Division } from "../chart/model.js";
import { housePatternDefinitions } from "./definitions/house-patterns.js";
import { moonRelativeDefinitions } from "./definitions/moon-relative.js";
import { panchaMahapurushaDefinitions } from "./definitions/pancha-mahapurusha.js";
import { relativePatternDefinitions } from "./definitions/relative-patterns.js";
import { signCardinalityDefinitions } from "./definitions/sign-cardinality.js";
import { InvalidYogaCatalogError } from "./error.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "./internal.js";

function normalizedAlias(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function conditionDivisions(condition: YogaCondition): readonly Division[] {
  return YogaCondition.$match(condition, {
    BodyPositionsCondition: ({ division }) => [division],
    BodyDignitiesCondition: ({ division }) => [division],
    OccupiedSignCountCondition: ({ division }) => [division],
    HouseOccupancyCondition: ({ division }) => [division],
    AllCondition: ({ children }) => children.flatMap(conditionDivisions),
    AnyCondition: ({ children }) => children.flatMap(conditionDivisions),
    NotCondition: ({ child }) => conditionDivisions(child),
  });
}

const freezeCondition: (condition: YogaCondition) => YogaCondition = YogaCondition.$match({
  BodyPositionsCondition: (condition) =>
    YogaCondition.BodyPositionsCondition({
      ...condition,
      bodies: Array.fromIterable(condition.bodies),
      expectedRelativeHouses: Array.fromIterable(condition.expectedRelativeHouses),
    }),
  BodyDignitiesCondition: (condition) =>
    YogaCondition.BodyDignitiesCondition({
      ...condition,
      bodies: Array.fromIterable(condition.bodies),
      expectedRelativeHouses: Array.fromIterable(condition.expectedRelativeHouses),
      expectedDignities: Array.fromIterable(condition.expectedDignities),
    }),
  OccupiedSignCountCondition: (condition) =>
    YogaCondition.OccupiedSignCountCondition({
      ...condition,
      bodies: Array.fromIterable(condition.bodies),
    }),
  HouseOccupancyCondition: (condition) =>
    YogaCondition.HouseOccupancyCondition({
      ...condition,
      expectedRelativeHouses: Array.fromIterable(condition.expectedRelativeHouses),
      excludedBodies: Array.fromIterable(condition.excludedBodies),
    }),
  AllCondition: (condition) =>
    YogaCondition.AllCondition({
      children: Array.map(condition.children, freezeCondition),
    }),
  AnyCondition: (condition) =>
    YogaCondition.AnyCondition({
      children: Array.map(condition.children, freezeCondition),
    }),
  NotCondition: (condition) =>
    YogaCondition.NotCondition({ child: freezeCondition(condition.child) }),
});

function freezeDefinition(definition: YogaDefinition): YogaDefinition {
  const [firstDivision, ...otherDivisions] = definition.requiredDivisions;
  const { aliases, classification, description, id, name } = definition.yoga;
  return {
    yoga: {
      id,
      name,
      aliases: Array.fromIterable(aliases),
      classification,
      description,
    },
    requiredDivisions: [firstDivision, ...otherDivisions] as const,
    strategy: YogaStrategy.$match(definition.strategy, {
      Condition: ({ condition }) =>
        YogaStrategy.Condition({ condition: freezeCondition(condition) }),
      Evaluator: ({ evaluate, name }) => YogaStrategy.Evaluator({ evaluate, name }),
    }),
  };
}

export const makeCatalog = Effect.fn("Yoga.makeCatalog")(function* (
  definitions: readonly YogaDefinition[],
) {
  const ids = MutableHashSet.empty<string>();
  const aliases = MutableHashSet.empty<string>();
  for (const definition of definitions) {
    if (MutableHashSet.has(ids, definition.yoga.id)) {
      return yield* InvalidYogaCatalogError.make({
        yogaId: definition.yoga.id,
        issue: "DuplicateId",
        detail: `Duplicate Yoga ID: ${definition.yoga.id}`,
      });
    }
    MutableHashSet.add(ids, definition.yoga.id);
    if (definition.requiredDivisions.length === 0) {
      return yield* InvalidYogaCatalogError.make({
        yogaId: definition.yoga.id,
        issue: "EmptyDivisions",
        detail: `Yoga ${definition.yoga.id} has no required Divisions`,
      });
    }
    const requiredDivisions = MutableHashSet.empty<Division>();
    for (const division of definition.requiredDivisions) {
      if (!Schema.is(Division)(division)) {
        return yield* InvalidYogaCatalogError.make({
          yogaId: definition.yoga.id,
          issue: "InvalidDivision",
          detail: `Yoga ${definition.yoga.id} has invalid required Division ${String(division)}`,
        });
      }
      if (MutableHashSet.has(requiredDivisions, division)) {
        return yield* InvalidYogaCatalogError.make({
          yogaId: definition.yoga.id,
          issue: "DuplicateDivision",
          detail: `Yoga ${definition.yoga.id} repeats required Division ${division}`,
        });
      }
      MutableHashSet.add(requiredDivisions, division);
    }
    if (YogaStrategy.$is("Condition")(definition.strategy)) {
      const usedDivisions = HashSet.fromIterable(conditionDivisions(definition.strategy.condition));
      const usedList = Array.fromIterable(usedDivisions);
      const requiredList = Array.fromIterable(requiredDivisions);
      if (
        usedList.some((division) => !MutableHashSet.has(requiredDivisions, division)) ||
        requiredList.some((division) => !HashSet.has(usedDivisions, division))
      ) {
        return yield* InvalidYogaCatalogError.make({
          yogaId: definition.yoga.id,
          issue: "DivisionMismatch",
          detail: `Yoga ${definition.yoga.id} condition and required Divisions disagree`,
        });
      }
    }
    for (const alias of definition.yoga.aliases) {
      const key = normalizedAlias(alias);
      if (key.length === 0) {
        return yield* InvalidYogaCatalogError.make({
          yogaId: definition.yoga.id,
          issue: "EmptyAlias",
          detail: `Yoga ${definition.yoga.id} has an empty alias`,
        });
      }
      if (MutableHashSet.has(aliases, key)) {
        return yield* InvalidYogaCatalogError.make({
          yogaId: definition.yoga.id,
          issue: "DuplicateAlias",
          detail: `Duplicate Yoga alias: ${alias}`,
        });
      }
      MutableHashSet.add(aliases, key);
    }
  }
  return Array.map(definitions, freezeDefinition);
});

export const definitions = Array.map(
  [
    ...moonRelativeDefinitions,
    ...relativePatternDefinitions,
    ...panchaMahapurushaDefinitions,
    ...signCardinalityDefinitions,
    ...housePatternDefinitions,
  ],
  freezeDefinition,
);

export const catalog = Array.map(definitions, ({ yoga }) => yoga);
