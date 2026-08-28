import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

function lunarOccupancy(
  relativeHouse: 2 | 12,
  excludedBodies: readonly ("Sun" | "Rahu" | "Ketu")[],
) {
  return YogaCondition.HouseOccupancyCondition({
    division: 1,
    referenceBody: "Moon",
    expectedRelativeHouses: [relativeHouse],
    excludedBodies,
    quantifier: "AnyHouse",
  });
}

export const moonRelativeDefinitions = [
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
    strategy: YogaStrategy.Condition({ condition: lunarOccupancy(2, ["Sun"]) }),
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
    strategy: YogaStrategy.Condition({ condition: lunarOccupancy(12, []) }),
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
        children: [lunarOccupancy(2, []), lunarOccupancy(12, [])],
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
          children: [lunarOccupancy(2, []), lunarOccupancy(12, [])],
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
  {
    yoga: {
      id: YogaIds.make("sakata"),
      name: "Sakata Yoga",
      aliases: [],
      classification: "Negative",
      description:
        "Traditionally associated with fluctuating fortune, privation, and periods of material difficulty.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.BodyPositionsCondition({
        division: 1,
        referenceBody: "Jupiter",
        bodies: ["Moon"],
        expectedRelativeHouses: [6, 8, 12],
        quantifier: "All",
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("amala"),
      name: "Amala Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with lasting reputation, a clear character, prosperity, and health.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AnyCondition({
        children: [
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Moon",
            bodies: ["Mercury", "Jupiter", "Venus"],
            expectedRelativeHouses: [10],
            quantifier: "Any",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Lagna",
            bodies: ["Moon", "Mercury", "Jupiter", "Venus"],
            expectedRelativeHouses: [10],
            quantifier: "Any",
          }),
        ],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("kusuma"),
      name: "Kusuma Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with prosperity, learning, virtue, authority, and an enduring reputation.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Lagna",
            bodies: ["Jupiter"],
            expectedRelativeHouses: [1],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Lagna",
            bodies: ["Moon"],
            expectedRelativeHouses: [7],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Moon",
            bodies: ["Sun"],
            expectedRelativeHouses: [8],
            quantifier: "All",
          }),
        ],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("thrilochana"),
      name: "Thrilochana Yoga",
      aliases: ["Trilochana"],
      classification: "Positive",
      description:
        "Traditionally associated with courage, learning, prosperity, and a respected public standing.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Moon",
            bodies: ["Sun", "Mars"],
            expectedRelativeHouses: [5, 9],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Sun",
            bodies: ["Mars"],
            expectedRelativeHouses: [5, 9],
            quantifier: "All",
          }),
        ],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("bhaskara"),
      name: "Bhaskara Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with wealth, courage, learning, and scholarly interests.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Sun",
            bodies: ["Mercury"],
            expectedRelativeHouses: [2],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Mercury",
            bodies: ["Moon"],
            expectedRelativeHouses: [11],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Moon",
            bodies: ["Jupiter"],
            expectedRelativeHouses: [5, 9],
            quantifier: "All",
          }),
        ],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("marud"),
      name: "Marud Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with generosity, prosperity, commercial success, and influence.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Venus",
            bodies: ["Jupiter"],
            expectedRelativeHouses: [5, 9],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Jupiter",
            bodies: ["Moon"],
            expectedRelativeHouses: [5],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Moon",
            bodies: ["Sun"],
            expectedRelativeHouses: [1, 4, 7, 10],
            quantifier: "All",
          }),
        ],
      }),
    }),
  },
  {
    yoga: {
      id: YogaIds.make("budha"),
      name: "Budha Yoga",
      aliases: [],
      classification: "Positive",
      description: "Traditionally associated with comfort, authority, intelligence, and learning.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.AllCondition({
        children: [
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Lagna",
            bodies: ["Jupiter"],
            expectedRelativeHouses: [1],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Lagna",
            bodies: ["Moon"],
            expectedRelativeHouses: [1, 4, 7, 10],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Moon",
            bodies: ["Rahu"],
            expectedRelativeHouses: [2],
            quantifier: "All",
          }),
          YogaCondition.BodyPositionsCondition({
            division: 1,
            referenceBody: "Rahu",
            bodies: ["Sun", "Mars"],
            expectedRelativeHouses: [3],
            quantifier: "All",
          }),
        ],
      }),
    }),
  },
] as const satisfies readonly YogaDefinition[];
