import { Houses } from "../../chart/model.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

function definition(
  id: string,
  name: string,
  lordOfHouse: 6 | 8 | 10 | 11 | 12,
  expectedRelativeHouses: readonly Houses[],
  classification: "Positive" | "Negative",
) {
  return {
    yoga: {
      id: YogaIds.make(id),
      name,
      aliases: [],
      classification,
      description: `${name} is formed by the specified house lord placement in D1.`,
    },
    requiredDivisions: [1] as const,
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.HouseLordPlacementCondition({
        division: 1,
        referenceBody: "Lagna",
        lordOfHouse,
        expectedRelativeHouses,
      }),
    }),
  };
}

export const houseLordPlacementDefinitions: readonly YogaDefinition[] = [
  definition("duryoga", "Duryoga", 10, [6, 8, 12], "Negative"),
  definition("daridra", "Daridra", 11, [6, 8, 12], "Negative"),
  definition("harsha", "Harsha", 6, [6], "Positive"),
  definition("sarala", "Sarala", 8, [8], "Positive"),
  definition("vimala", "Vimala", 12, [12], "Positive"),
];
