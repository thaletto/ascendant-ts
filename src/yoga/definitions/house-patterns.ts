import type { YogaDefinition } from "../internal.js";
import { YogaIds } from "../model.js";
import { ASTROTALK_CATALOG, RAMAN_300_COMBINATIONS } from "./sources.js";

export const housePatternDefinitions = Object.freeze([
  {
    yoga: {
      id: YogaIds.make("chatussagara"),
      name: "Chatussagara Yoga",
      aliases: ["Chatusagara"],
      classification: "Positive",
      description:
        "Traditionally associated with broad reputation, health, longevity, prosperity, grace, and capable children.",
    },
    requiredDivisions: [1],
    condition: {
      _tag: "HouseOccupancyCondition",
      division: 1,
      referenceBody: "Lagna",
      expectedRelativeHouses: [1, 4, 7, 10],
      excludedBodies: [],
      quantifier: "EveryHouse",
    },
    sources: [ASTROTALK_CATALOG, RAMAN_300_COMBINATIONS],
  },
  {
    yoga: {
      id: YogaIds.make("vasumathi"),
      name: "Vasumathi Yoga",
      aliases: ["Vasumati"],
      classification: "Positive",
      description:
        "Traditionally associated with diligence, social esteem, prosperity, independence, and generosity.",
    },
    requiredDivisions: [1],
    condition: {
      _tag: "AnyCondition",
      children: [
        {
          _tag: "BodyPositionsCondition",
          division: 1,
          referenceBody: "Lagna",
          bodies: ["Mercury", "Jupiter", "Venus"],
          expectedRelativeHouses: [3, 6, 10, 11],
          quantifier: "Any",
        },
        {
          _tag: "BodyPositionsCondition",
          division: 1,
          referenceBody: "Moon",
          bodies: ["Mercury", "Jupiter", "Venus"],
          expectedRelativeHouses: [3, 6, 10, 11],
          quantifier: "Any",
        },
      ],
    },
    sources: [ASTROTALK_CATALOG, RAMAN_300_COMBINATIONS],
  },
  {
    yoga: {
      id: YogaIds.make("rajalakshana"),
      name: "Rajalakshana Yoga",
      aliases: ["Raja Lakshana"],
      classification: "Positive",
      description:
        "Traditionally associated with stature, admirable qualities, respect, dignity, and an attractive appearance.",
    },
    requiredDivisions: [1],
    condition: {
      _tag: "BodyPositionsCondition",
      division: 1,
      referenceBody: "Lagna",
      bodies: ["Moon", "Mercury", "Jupiter", "Venus"],
      expectedRelativeHouses: [1, 4, 7, 10],
      quantifier: "All",
    },
    sources: [ASTROTALK_CATALOG, RAMAN_300_COMBINATIONS],
  },
] as const satisfies readonly YogaDefinition[]);
