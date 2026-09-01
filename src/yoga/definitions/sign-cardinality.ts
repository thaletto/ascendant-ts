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

function occupiedSignCount(expectedSignCount: number) {
  return YogaCondition.OccupiedSignCountCondition({
    division: 1,
    bodies: allModeledPlanets,
    expectedSignCount,
  });
}

function signCardinality(
  id: string,
  name: string,
  classification: YogaClassification,
  expectedSignCount: number,
  description: string,
): YogaDefinition {
  return {
    yoga: { id: YogaIds.make(id), name, aliases: [], classification, description },
    requiredDivisions: [1],
    strategy: YogaStrategy.Condition({ condition: occupiedSignCount(expectedSignCount) }),
  };
}

export const signCardinalityDefinitions = [
  signCardinality(
    "vallaki",
    "Vallaki Yoga",
    "Positive",
    7,
    "Traditionally associated with happiness, friendship, music, learning, and recognition.",
  ),
  signCardinality(
    "damni",
    "Damni Yoga",
    "Positive",
    6,
    "Traditionally associated with wealth, charity, and protection of living beings.",
  ),
  signCardinality(
    "pasa",
    "Pasa Yoga",
    "Positive",
    5,
    "Traditionally associated with ethical wealth, relatives, friends, and family support.",
  ),
  signCardinality(
    "kedara",
    "Kedara Yoga",
    "Positive",
    4,
    "Traditionally associated with agriculture, livelihood, service, and practical work.",
  ),
  signCardinality(
    "sula",
    "Sula Yoga",
    "Neutral",
    3,
    "Traditionally associated with courage, risk-taking, hardship, and a forceful nature.",
  ),
  signCardinality(
    "yuga",
    "Yuga Yoga",
    "Negative",
    2,
    "Traditionally associated with poverty, exclusion, instability, and harmful habits.",
  ),
] as const satisfies readonly YogaDefinition[];
