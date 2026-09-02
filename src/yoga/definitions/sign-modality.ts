import { YogaCondition, type YogaDefinition, YogaStrategy } from "../internal.js";
import { YogaIds, type YogaClassification } from "../model.js";

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

function signModality(
  id: string,
  name: string,
  classification: YogaClassification,
  expectedModality: "Movable" | "Fixed" | "Dual",
  description: string,
): YogaDefinition {
  return {
    yoga: { id: YogaIds.make(id), name, aliases: [], classification, description },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({
      condition: YogaCondition.SignModalityCondition({
        division: 1,
        bodies: allModeledPlanets,
        expectedModality,
      }),
    }),
  };
}

export const signModalityDefinitions = [
  signModality(
    "rajju",
    "Rajju Yoga",
    "Neutral",
    "Movable",
    "All modeled planets occupy movable signs.",
  ),
  signModality(
    "musala",
    "Musala Yoga",
    "Neutral",
    "Fixed",
    "All modeled planets occupy fixed signs.",
  ),
  signModality("nala", "Nala Yoga", "Neutral", "Dual", "All modeled planets occupy dual signs."),
] as const satisfies readonly YogaDefinition[];
