import type { Houses } from "../../chart/model.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

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

function continuousSignWindow(startingRelativeHouse: Houses) {
  return YogaCondition.ContinuousSignWindowCondition({
    division: 1,
    referenceBody: "Lagna",
    bodies: allModeledPlanets,
    startingRelativeHouse,
    signCount: 4,
  });
}

function continuousSignPattern(
  id: string,
  name: string,
  startingRelativeHouse: Houses,
): YogaDefinition {
  return {
    yoga: {
      id: YogaIds.make(id),
      name,
      aliases: [],
      classification: "Neutral",
      description: `All nine modeled planets occupy four consecutive signs beginning from the ${startingRelativeHouse}th house from Lagna.`,
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: continuousSignWindow(startingRelativeHouse),
    }),
  };
}

export const continuousSignPatternDefinitions: readonly YogaDefinition[] = [
  continuousSignPattern("yupa", "Yupa Yoga", 1),
  continuousSignPattern("ishu", "Ishu Yoga", 4),
  continuousSignPattern("sakti", "Sakti Yoga", 7),
  continuousSignPattern("danda", "Danda Yoga", 10),
];
