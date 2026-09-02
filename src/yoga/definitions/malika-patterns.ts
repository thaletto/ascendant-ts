import type { Houses } from "../../chart/model.js";
import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

const classicalPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;

function houseWindow(start: Houses): readonly Houses[] {
  return Array.from({ length: 7 }, (_, offset) => (((start - 1 + offset) % 12) + 1) as Houses);
}

function malikaDefinition(id: string, name: string, start: Houses): YogaDefinition {
  const expectedRelativeHouses = houseWindow(start);

  return {
    yoga: {
      id: YogaIds.make(id),
      name,
      aliases: [],
      classification: "Positive",
      description: `Seven classical planets occupy seven consecutive houses starting from house ${start}.`,
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
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
      }),
    }),
  };
}

export const malikaPatternDefinitions: readonly YogaDefinition[] = [
  malikaDefinition("lagna_malika", "Lagna Malika Yoga", 1),
  malikaDefinition("dhana_malika", "Dhana Malika Yoga", 2),
  malikaDefinition("vikrama_malika", "Vikrama Malika Yoga", 3),
  malikaDefinition("sukha_malika", "Sukha Malika Yoga", 4),
  malikaDefinition("putra_malika", "Putra Malika Yoga", 5),
  malikaDefinition("satru_malika", "Satru Malika Yoga", 6),
  malikaDefinition("kalatra_malika", "Kalatra Malika Yoga", 7),
  malikaDefinition("randhra_malika", "Randhra Malika Yoga", 8),
  malikaDefinition("bhagya_malika", "Bhagya Malika Yoga", 9),
  malikaDefinition("karma_malika", "Karma Malika Yoga", 10),
  malikaDefinition("labha_malika", "Labha Malika Yoga", 11),
  malikaDefinition("vraya_malika", "Vraya Malika Yoga", 12),
];
