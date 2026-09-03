import { PLANETS } from "../../chart/internal/constants.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

export const golaCardinalityDefinitions = [
  {
    yoga: {
      id: YogaIds.make("gola_yoga"),
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
        bodies: PLANETS,
        expectedSignCount: 1,
      }),
    }),
  },
] as const satisfies readonly YogaDefinition[];
