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

export const golaCardinalityDefinitions = [
  {
    yoga: {
      id: YogaIds.make("gola_single_sign"),
      name: "Gola Yoga",
      aliases: [],
      classification: "Negative",
      description:
        "Traditionally associated with a concentrated and constrained life pattern when all modeled planets occupy one sign.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.OccupiedSignCountCondition({
        division: 1,
        bodies: allModeledPlanets,
        expectedSignCount: 1,
      }),
    }),
  },
] as const satisfies readonly YogaDefinition[];
