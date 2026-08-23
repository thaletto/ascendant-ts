import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

const lunarOccupancy = (relativeHouse: 2 | 12) =>
  YogaCondition.HouseOccupancyCondition({
    division: 1,
    referenceBody: "Moon",
    expectedRelativeHouses: [relativeHouse],
    excludedBodies: ["Sun", "Rahu", "Ketu"],
    quantifier: "AnyHouse",
  });

export const moonRelativeDefinitions = Object.freeze([
  {
    yoga: {
      id: YogaIds.make("gajakesari"),
      name: "Gajakesari Yoga",
      aliases: ["GajaKesari", "Gajkesari"],
      classification: "Positive",
      description:
        "Traditionally associated with generosity, public responsibility, reputation, and enduring recognition.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Moon",
        bodies: ["Jupiter"],
        expectedRelativeHouses: [1, 4, 7, 10],
        quantifier: "All",
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("sunapha"),
      name: "Sunapha Yoga",
      aliases: ["Sunaphaa"],
      classification: "Positive",
      description:
        "Traditionally associated with self-earned prosperity, intelligence, sound decisions, and reputation.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: lunarOccupancy(2) }),
  },
  {
    yoga: {
      id: YogaIds.make("anapha"),
      name: "Anapha Yoga",
      aliases: ["Anaphaa"],
      classification: "Positive",
      description:
        "Traditionally associated with health, dignity, generosity, reputation, comfort, and later austerity.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: lunarOccupancy(12) }),
  },
  {
    yoga: {
      id: YogaIds.make("dhurdhua"),
      name: "Dhurdhua Yoga",
      aliases: ["Durudhara", "Durdhura", "Durudhura"],
      classification: "Positive",
      description:
        "Traditionally associated with wealth, generosity, charitable conduct, influence, and reputation.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [lunarOccupancy(2), lunarOccupancy(12)],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("kemadruma"),
      name: "Kemadruma Yoga",
      aliases: ["KemaDurga", "Kema Druma"],
      classification: "Negative",
      description:
        "Traditionally associated with isolation, hardship, material instability, and dependence on others.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.NotCondition({
        child: YogaCondition.AnyCondition({
          children: [lunarOccupancy(2), lunarOccupancy(12)],
        }),
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("chandra_mangala"),
      name: "Chandra Mangala Yoga",
      aliases: ["Chandra-Mangala"],
      classification: "Negative",
      description:
        "In the selected catalog convention, traditionally associated with harsh conduct, conflict, and troubled family relations.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Moon",
        bodies: ["Mars"],
        expectedRelativeHouses: [1],
        quantifier: "All",
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("adhi"),
      name: "Adhi Yoga",
      aliases: ["Chandra Adhi"],
      classification: "Positive",
      description:
        "Traditionally associated with trustworthiness, prosperity, comfort, health, longevity, and victory over opposition.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Moon",
        bodies: ["Mercury", "Jupiter", "Venus"],
        expectedRelativeHouses: [6, 7, 8],
        quantifier: "All",
      }),
    }),
  },
] as const satisfies readonly YogaDefinition[]);
