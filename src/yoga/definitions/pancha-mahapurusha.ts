import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds } from "../model.js";

function panchaMahapurushaCondition(body: "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn") {
  return YogaCondition.BodyDignitiesCondition({
    division: 1,
    referenceBody: "Lagna",
    bodies: [body],
    expectedRelativeHouses: [1, 4, 7, 10],
    expectedDignities: ["OWN", "EXALTED"],
  });
}

export const panchaMahapurushaDefinitions = [
  {
    yoga: {
      id: YogaIds.make("hamsa"),
      name: "Hamsa Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with virtue, attractiveness, health, longevity, and prosperity.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: panchaMahapurushaCondition("Jupiter") }),
  },
  {
    yoga: {
      id: YogaIds.make("malavya"),
      name: "Malavya Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with dignity, comfort, strength, wealth, and refined character.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: panchaMahapurushaCondition("Venus") }),
  },
  {
    yoga: {
      id: YogaIds.make("sasa"),
      name: "Sasa Yoga",
      aliases: ["Shasha"],
      classification: "Neutral",
      description:
        "Traditionally associated with authority, command, endurance, and a forceful temperament.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: panchaMahapurushaCondition("Saturn") }),
  },
  {
    yoga: {
      id: YogaIds.make("ruchaka"),
      name: "Ruchaka Yoga",
      aliases: ["Ruchaka Mahapurusha"],
      classification: "Positive",
      description:
        "Traditionally associated with courage, physical strength, leadership, wealth, and longevity.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: panchaMahapurushaCondition("Mars") }),
  },
  {
    yoga: {
      id: YogaIds.make("bhadra"),
      name: "Bhadra Yoga",
      aliases: [],
      classification: "Positive",
      description:
        "Traditionally associated with intelligence, helpfulness, physical strength, and longevity.",
    },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: panchaMahapurushaCondition("Mercury") }),
  },
] as const satisfies readonly YogaDefinition[];
