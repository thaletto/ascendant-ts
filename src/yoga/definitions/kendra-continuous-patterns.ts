import type { Houses } from "../../chart/model.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

const classicalPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;

function continuousHouses(start: Houses): readonly Houses[] {
  return Array.from({ length: 7 }, (_, offset) => (((start - 1 + offset) % 12) + 1) as Houses);
}

function kendraContinuousCondition(start: Houses) {
  const expectedRelativeHouses = continuousHouses(start);
  return YogaCondition.AllCondition({
    children: [
      YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Lagna",
        bodies: classicalPlanets,
        expectedRelativeHouses,
        quantifier: "All",
      }),
      YogaCondition.HouseOccupancyCondition({
        division: 1,
        referenceBody: "Lagna",
        expectedRelativeHouses,
        excludedBodies: ["Rahu", "Ketu"],
        quantifier: "EveryHouse",
      }),
    ],
  });
}

export const kendraContinuousPatternDefinitions = [
  {
    yoga: {
      id: YogaIds.make("nav"),
      name: "Nav Yoga",
      aliases: [],
      classification: "Neutral",
      description:
        "The Nav Yoga is formed by the disposition of the seven planets in seven continuous houses from Lagna, 4th house, 7th house, and 10th house respectively.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: kendraContinuousCondition(1) }),
  },
  {
    yoga: {
      id: YogaIds.make("kuta"),
      name: "Kuta Yoga",
      aliases: [],
      classification: "Negative",
      description:
        "Kuta Yoga is formed by the disposition of the seven planets in seven continuous houses from Lagna, 4th house, 7th house, and 10th house respectively.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: kendraContinuousCondition(4) }),
  },
  {
    yoga: {
      id: YogaIds.make("chhatra"),
      name: "Chhatra Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Chhatra Yoga is formed by the disposition of the seven planets in seven continuous houses from Lagna, 4th house, 7th house, and 10th house respectively.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: kendraContinuousCondition(7) }),
  },
  {
    yoga: {
      id: YogaIds.make("chapa_continuous"),
      name: "Chapa Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Chapa Yoga is formed by the disposition of the seven planets in seven continuous houses from Lagna, 4th house, 7th house, and 10th house respectively.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: kendraContinuousCondition(10) }),
  },
] as const satisfies readonly YogaDefinition[];
