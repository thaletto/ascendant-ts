import { PLANETS } from "../../chart/internal/constants.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

function fifthFrom(referenceBody: "Lagna" | "Sun" | "Moon") {
  return YogaCondition.BodyPositionsCondition({
    division: 1,
    referenceBody,
    bodies: PLANETS,
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
