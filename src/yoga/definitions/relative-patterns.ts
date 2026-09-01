import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

function sunRelativeOccupancy(relativeHouse: 2 | 12) {
  return YogaCondition.HouseOccupancyCondition({
    division: 1,
    referenceBody: "Sun",
    expectedRelativeHouses: [relativeHouse],
    excludedBodies: ["Moon"],
    quantifier: "AnyHouse",
  });
}

const allModeledPlanets = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
] as const;

export const relativePatternDefinitions = [
  {
    yoga: {
      id: YogaIds.make("vesi"),
      name: "Vesi Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with fortune, happiness, virtue, prosperity, and recognition.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: sunRelativeOccupancy(2) }),
  },
  {
    yoga: {
      id: YogaIds.make("vasi"),
      name: "Vasi Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with happiness, prosperity, tolerance, and social favor.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: sunRelativeOccupancy(12) }),
  },
  {
    yoga: {
      id: YogaIds.make("obhayachari"),
      name: "Obhayachari Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with eloquence, confidence, wealth, and public impression.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [sunRelativeOccupancy(2), sunRelativeOccupancy(12)],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("budha_aditya"),
      name: "Budha-Aditya Yoga",
      aliases: ["Budhaditya"],
      classification: "Positive",
      description:
        "Traditionally associated with intelligence, skill, reputation, self-respect, and comfort.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Sun",
        bodies: ["Mercury"],
        expectedRelativeHouses: [1],
        quantifier: "All",
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("srik"),
      name: "Srik Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with prosperity and the benefits of benefics placed in kendras.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Lagna",
        bodies: ["Mercury", "Jupiter", "Venus"],
        expectedRelativeHouses: [1, 4, 7, 10],
        quantifier: "All",
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("chandra"),
      name: "Chandra Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with authority, attention, support, and productive use of wealth.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Lagna",
        bodies: allModeledPlanets,
        expectedRelativeHouses: [1, 3, 5, 7, 9, 11],
        quantifier: "All",
      }),
    }),
  },
] as const satisfies readonly YogaDefinition[];
