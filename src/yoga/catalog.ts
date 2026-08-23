import { Effect, Schema } from "effect";
import { Division } from "../chart/model.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "./internal.js";
import { housePatternDefinitions } from "./definitions/house-patterns.js";
import { moonRelativeDefinitions } from "./definitions/moon-relative.js";
import { InvalidYogaCatalogError } from "./error.js";

function normalizedAlias(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function conditionDivisions(condition: YogaCondition): readonly (typeof Division.Type)[] {
  return YogaCondition.$match(condition, {
    BodyPositionsCondition: ({ division }) => [division],
    HouseOccupancyCondition: ({ division }) => [division],
    AllCondition: ({ children }) => children.flatMap(conditionDivisions),
    AnyCondition: ({ children }) => children.flatMap(conditionDivisions),
    NotCondition: ({ child }) => conditionDivisions(child),
  });
}

const freezeCondition: (condition: YogaCondition) => YogaCondition = YogaCondition.$match({
  BodyPositionsCondition: (condition) =>
    Object.freeze(
      YogaCondition.BodyPositionsCondition({
        ...condition,
        bodies: Object.freeze([...condition.bodies]),
        expectedRelativeHouses: Object.freeze([...condition.expectedRelativeHouses]),
      }),
    ),
  HouseOccupancyCondition: (condition) =>
    Object.freeze(
      YogaCondition.HouseOccupancyCondition({
        ...condition,
        expectedRelativeHouses: Object.freeze([...condition.expectedRelativeHouses]),
        excludedBodies: Object.freeze([...condition.excludedBodies]),
      }),
    ),
  AllCondition: (condition) =>
    Object.freeze(
      YogaCondition.AllCondition({
        children: Object.freeze(condition.children.map(freezeCondition)),
      }),
    ),
  AnyCondition: (condition) =>
    Object.freeze(
      YogaCondition.AnyCondition({
        children: Object.freeze(condition.children.map(freezeCondition)),
      }),
    ),
  NotCondition: (condition) =>
    Object.freeze(YogaCondition.NotCondition({ child: freezeCondition(condition.child) })),
});

function freezeDefinition(definition: YogaDefinition): YogaDefinition {
  const [firstDivision, ...otherDivisions] = definition.requiredDivisions;
  const { aliases, classification, description, id, name } = definition.yoga;
  return Object.freeze({
    yoga: Object.freeze({
      id,
      name,
      aliases: Object.freeze([...aliases]),
      classification,
      description,
    }),
    requiredDivisions: Object.freeze([firstDivision, ...otherDivisions] as const),
    strategy: YogaStrategy.$match(definition.strategy, {
      Condition: ({ condition }) =>
        Object.freeze(YogaStrategy.Condition({ condition: freezeCondition(condition) })),
      Evaluator: ({ evaluate, name }) => Object.freeze(YogaStrategy.Evaluator({ evaluate, name })),
    }),
  });
}

export const makeCatalog = Effect.fn("Yoga.makeCatalog")(function* (
  definitions: readonly YogaDefinition[],
) {
  const ids = new Set<string>();
  const aliases = new Set<string>();
  for (const definition of definitions) {
    if (ids.has(definition.yoga.id)) {
      return yield* new InvalidYogaCatalogError({
        yogaId: definition.yoga.id,
        issue: "DuplicateId",
        detail: `Duplicate Yoga ID: ${definition.yoga.id}`,
      });
    }
    ids.add(definition.yoga.id);
    if (definition.requiredDivisions.length === 0) {
      return yield* new InvalidYogaCatalogError({
        yogaId: definition.yoga.id,
        issue: "EmptyDivisions",
        detail: `Yoga ${definition.yoga.id} has no required Divisions`,
      });
    }
    const requiredDivisions = new Set<typeof Division.Type>();
    for (const division of definition.requiredDivisions) {
      if (!Schema.is(Division)(division)) {
        return yield* new InvalidYogaCatalogError({
          yogaId: definition.yoga.id,
          issue: "InvalidDivision",
          detail: `Yoga ${definition.yoga.id} has invalid required Division ${String(division)}`,
        });
      }
      if (requiredDivisions.has(division)) {
        return yield* new InvalidYogaCatalogError({
          yogaId: definition.yoga.id,
          issue: "DuplicateDivision",
          detail: `Yoga ${definition.yoga.id} repeats required Division ${division}`,
        });
      }
      requiredDivisions.add(division);
    }
    if (YogaStrategy.$is("Condition")(definition.strategy)) {
      const usedDivisions = new Set(conditionDivisions(definition.strategy.condition));
      if (
        [...usedDivisions].some((division) => !requiredDivisions.has(division)) ||
        [...requiredDivisions].some((division) => !usedDivisions.has(division))
      ) {
        return yield* new InvalidYogaCatalogError({
          yogaId: definition.yoga.id,
          issue: "DivisionMismatch",
          detail: `Yoga ${definition.yoga.id} condition and required Divisions disagree`,
        });
      }
    }
    for (const alias of definition.yoga.aliases) {
      const key = normalizedAlias(alias);
      if (key.length === 0) {
        return yield* new InvalidYogaCatalogError({
          yogaId: definition.yoga.id,
          issue: "EmptyAlias",
          detail: `Yoga ${definition.yoga.id} has an empty alias`,
        });
      }
      if (aliases.has(key)) {
        return yield* new InvalidYogaCatalogError({
          yogaId: definition.yoga.id,
          issue: "DuplicateAlias",
          detail: `Duplicate Yoga alias: ${alias}`,
        });
      }
      aliases.add(key);
    }
  }
  return Object.freeze(definitions.map(freezeDefinition));
});

export const definitions = Object.freeze(
  [...moonRelativeDefinitions, ...housePatternDefinitions].map(freezeDefinition),
);

export const catalog = Object.freeze(definitions.map(({ yoga }) => yoga));
