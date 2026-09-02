import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

const kendraHouses = [1, 4, 7, 10] as const;

function houseLordInKendras(lordOfHouse: 1 | 5 | 9 | 10): YogaCondition {
  return YogaCondition.HouseLordPlacementCondition({
    division: 1,
    referenceBody: "Lagna",
    lordOfHouse,
    expectedRelativeHouses: kendraHouses,
  });
}

function bodyInKendra(body: "Jupiter" | "Venus"): YogaCondition {
  return YogaCondition.BodyPositionsCondition({
    division: 1,
    referenceBody: "Lagna",
    bodies: [body],
    expectedRelativeHouses: kendraHouses,
    quantifier: "Any",
  });
}

export const houseLordCombinationDefinitions: readonly YogaDefinition[] = [
  {
    yoga: {
      id: YogaIds.make("siva"),
      name: "Siva Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "The 5th lord occupies the 9th, the 9th lord occupies the 10th, and the 10th lord occupies the 5th in D1.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [
          YogaCondition.HouseLordPlacementCondition({
            division: 1,
            referenceBody: "Lagna",
            lordOfHouse: 5,
            expectedRelativeHouses: [9],
          }),
          YogaCondition.HouseLordPlacementCondition({
            division: 1,
            referenceBody: "Lagna",
            lordOfHouse: 9,
            expectedRelativeHouses: [10],
          }),
          YogaCondition.HouseLordPlacementCondition({
            division: 1,
            referenceBody: "Lagna",
            lordOfHouse: 10,
            expectedRelativeHouses: [5],
          }),
        ],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("sareera_soukhya"),
      name: "Sareera Soukhya Yoga",
      aliases: [],
      classification: "Positive",
      description: "The Lagna lord, Jupiter, or Venus occupies a Lagna Kendra in D1.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AnyCondition({
        children: [houseLordInKendras(1), bodyInKendra("Jupiter"), bodyInKendra("Venus")],
      }),
    }),
  },
] as const;
