import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

export const naturalPlanetGroupDefinitions = [
  {
    yoga: {
      id: YogaIds.make("sarpa"),
      name: "Sarpa Yoga",
      aliases: [],
      classification: "Negative",
      description: "All natural malefics occupy kendras from the Lagna.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.NaturalPlanetGroupPositionsCondition({
        division: 1,
        referenceBody: "Lagna",
        group: "NaturalMalefics",
        expectedRelativeHouses: [1, 4, 7, 10],
        quantifier: "All",
      }),
    }),
  },
] as const satisfies readonly YogaDefinition[];
