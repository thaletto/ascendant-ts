import { PLANETS } from "../../chart/internal/constants.js";
import type { Houses } from "../../chart/model.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

function planetsIn(expectedRelativeHouses: readonly Houses[]) {
  return YogaCondition.BodyPositionsCondition({
    division: 1,
    referenceBody: "Lagna",
    bodies: PLANETS,
    expectedRelativeHouses,
    quantifier: "All",
  });
}

export const housePatternDefinitions = [
  {
    yoga: {
      id: YogaIds.make("chatussagara"),
      name: "Chatussagara Yoga",
      aliases: ["Chatusagara"],
      classification: "Positive",
      description:
        "Traditionally associated with broad reputation, health, longevity, prosperity, grace, and capable children.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.HouseOccupancyCondition({
        division: 1,
        referenceBody: "Lagna",
        expectedRelativeHouses: [1, 4, 7, 10],
        excludedBodies: [],
        quantifier: "EveryHouse",
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("vasumathi"),
      name: "Vasumathi Yoga",
      aliases: ["Vasumati"],
      classification: "Positive",
      description:
        "Traditionally associated with diligence, social esteem, prosperity, independence, and generosity.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AnyCondition({
        children: [
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Lagna",
            bodies: ["Mercury", "Jupiter", "Venus"],
            expectedRelativeHouses: [3, 6, 10, 11],
            quantifier: "Any",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Moon",
            bodies: ["Mercury", "Jupiter", "Venus"],
            expectedRelativeHouses: [3, 6, 10, 11],
            quantifier: "Any",
          }),
        ],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("rajalakshana"),
      name: "Rajalakshana Yoga",
      aliases: ["Raja Lakshana"],
      classification: "Positive",
      description:
        "Traditionally associated with stature, admirable qualities, respect, dignity, and an attractive appearance.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Lagna",
        bodies: ["Moon", "Mercury", "Jupiter", "Venus"],
        expectedRelativeHouses: [1, 4, 7, 10],
        quantifier: "All",
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("kamala"),
      name: "Kamala Yoga",
      aliases: [],
      classification: "Positive",
      description: "Traditionally associated with prestige, reputation, virtue, and public honor.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: planetsIn([1, 4, 7, 10]) }),
  },
  {
    yoga: {
      id: YogaIds.make("gada"),
      name: "Gada Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with learning, devotion, wealth, and disciplined effort.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AnyCondition({
        children: [planetsIn([1, 7]), planetsIn([4, 10])],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("vapee"),
      name: "Vapee Yoga",
      aliases: ["Vapi"],
      classification: "Positive",
      description:
        "Traditionally associated with accumulated wealth, resources, and financial security.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AnyCondition({
        children: [planetsIn([2, 5, 8, 11]), planetsIn([3, 6, 9, 12])],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("samudra"),
      name: "Samudra Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with authority, freedom, courage, and a broad outlook.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: planetsIn([2, 4, 6, 8, 10, 12]),
    }),
  },
] as const satisfies readonly YogaDefinition[];
