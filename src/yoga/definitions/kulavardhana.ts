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

function fifthFrom(referenceBody: "Lagna" | "Sun" | "Moon") {
  return YogaCondition.BodyPositionsCondition({
    division: 1,
    referenceBody,
    bodies: allModeledPlanets,
    expectedRelativeHouses: [5],
    quantifier: "All",
  });
}

export const kulavardhanaDefinitions = [
  {
    yoga: {
      id: YogaIds.make("kulavardhana"),
      name: "Kulavardhana Yoga",
      aliases: [],
      classification: "Positive",
      description: "All modeled planets occupy the fifth house from Lagna, Sun, and Moon.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [fifthFrom("Lagna"), fifthFrom("Sun"), fifthFrom("Moon")],
      }),
    }),
  },
] as const satisfies readonly YogaDefinition[];
