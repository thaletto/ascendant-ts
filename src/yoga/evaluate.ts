import { Array, Effect, MutableHashMap, Option, Record, Result, Schema, Match } from "effect";

import {
  Houses,
  Chart,
  ChartCalculation,
  Division,
  PlanetDignity,
  Planets,
  PlanetsLagna,
  Rashis,
  RashiLords,
} from "../chart/model.js";
import { InvalidYogaEvidenceError } from "./error.js";
import {
  YogaStrategy,
  type EvaluationIndex,
  type IndexedDivision,
  type YogaCondition,
  type YogaDefinition,
} from "./internal.js";
import type { YogaEvidence } from "./model.js";

function normalizeHouse(value: number): Houses {
  return Schema.decodeUnknownSync(Houses)(((((value - 1) % 12) + 12) % 12) + 1);
}

function signModality(sign: Rashis): "Movable" | "Fixed" | "Dual" {
  if (["Aries", "Cancer", "Libra", "Capricorn"].includes(sign)) return "Movable";
  if (["Taurus", "Leo", "Scorpio", "Aquarius"].includes(sign)) return "Fixed";
  return "Dual";
}

const zodiacSigns: readonly Rashis[] = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const naturalMalefics = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"] as const;

function consecutiveSigns(start: Rashis, count: number): readonly Rashis[] {
  const startIndex = zodiacSigns.indexOf(start);
  if (startIndex === -1) throw new Error(`Unknown zodiac sign: ${start}`);
  return globalThis.Array.from(
    { length: count },
    (_, offset) => zodiacSigns[(startIndex + offset) % 12]!,
  );
}

function rashiLord(sign: Rashis): RashiLords {
  const lords: Record<Rashis, RashiLords> = {
    Aries: "Mars",
    Taurus: "Venus",
    Gemini: "Mercury",
    Cancer: "Moon",
    Leo: "Sun",
    Virgo: "Mercury",
    Libra: "Venus",
    Scorpio: "Mars",
    Sagittarius: "Jupiter",
    Capricorn: "Saturn",
    Aquarius: "Saturn",
    Pisces: "Jupiter",
  };
  return lords[sign];
}

export function makeEvaluationIndex(calculation: ChartCalculation): EvaluationIndex {
  const cache = MutableHashMap.empty<
    Division,
    Result.Result<IndexedDivision, InvalidYogaEvidenceError>
  >();

  const buildDivision = (
    division: Division,
  ): Result.Result<IndexedDivision, InvalidYogaEvidenceError> => {
    let chart: Chart | undefined;
    for (const candidate of calculation.charts) {
      if (candidate.division !== division) continue;
      if (chart !== undefined) {
        return Result.fail(
          InvalidYogaEvidenceError.make({
            message: `Duplicate D${division} Chart in Yoga evaluation input`,
            cause: new Error(`Duplicate D${division} Chart in Yoga evaluation input`),
          }),
        );
      }
      chart = candidate;
    }
    if (chart === undefined) {
      return Result.fail(
        InvalidYogaEvidenceError.make({
          message: `Missing D${division} Chart in Yoga evaluation input`,
          cause: new Error(`Missing D${division} Chart in Yoga evaluation input`),
        }),
      );
    }

    const positions = MutableHashMap.empty<string, Houses>();
    const dignities = MutableHashMap.empty<Planets, readonly PlanetDignity[]>();
    const signs = MutableHashMap.empty<Planets, Rashis>();
    const occupants = MutableHashMap.empty<Houses, readonly Planets[]>();
    let lagnaHouse: Houses | undefined;
    for (const [houseText, house] of Record.toEntries(chart.houses)) {
      const houseNumber = Schema.decodeUnknownSync(Houses)(Number(houseText));
      if (house.lagna !== null) {
        if (lagnaHouse !== undefined) {
          return Result.fail(
            InvalidYogaEvidenceError.make({
              message: `Multiple Lagna positions in D${division}`,
              cause: new Error(`Multiple Lagna positions in D${division}`),
            }),
          );
        }
        lagnaHouse = houseNumber;
      }
      for (const planet of house.planets) {
        if (MutableHashMap.has(positions, planet.name)) {
          return Result.fail(
            InvalidYogaEvidenceError.make({
              message: `Duplicate ${planet.name} position in D${division}`,
              cause: new Error(`Duplicate ${planet.name} position in D${division}`),
            }),
          );
        }
        MutableHashMap.set(positions, planet.name, houseNumber);
        MutableHashMap.set(dignities, planet.name, planet.in_sign);
        MutableHashMap.set(signs, planet.name, planet.sign.name);
      }
      MutableHashMap.set(
        occupants,
        houseNumber,
        Array.map(house.planets, (planet) => planet.name),
      );
    }
    if (lagnaHouse === undefined) {
      return Result.fail(
        InvalidYogaEvidenceError.make({
          message: `Missing Lagna position in D${division}`,
          cause: new Error(`Missing Lagna position in D${division}`),
        }),
      );
    }
    MutableHashMap.set(positions, "Lagna", lagnaHouse);

    const indexed: IndexedDivision = {
      positionOf: (body: PlanetsLagna): Houses => {
        const house = MutableHashMap.get(positions, body);
        if (Option.isNone(house)) throw new Error(`Missing ${body} position in D${division}`);
        return house.value;
      },
      dignitiesOf: (body: Planets): readonly PlanetDignity[] => {
        const bodyDignities = MutableHashMap.get(dignities, body);
        if (Option.isNone(bodyDignities)) {
          throw new Error(`Missing ${body} dignity in D${division}`);
        }
        return bodyDignities.value;
      },
      signOf: (body: Planets): Rashis => {
        const sign = MutableHashMap.get(signs, body);
        if (Option.isNone(sign)) throw new Error(`Missing ${body} sign in D${division}`);
        return sign.value;
      },
      signAtRelativeHouse: (referenceBody, relativeHouse) => {
        const referenceHouse = indexed.positionOf(referenceBody);
        const absoluteHouse = normalizeHouse(referenceHouse + relativeHouse - 1);
        const house = chart?.houses[absoluteHouse];
        if (house === undefined) throw new Error(`Missing house ${absoluteHouse} in D${division}`);
        return house.sign;
      },
      occupantsAtRelativeHouse: (
        referenceBody: PlanetsLagna,
        relativeHouse: Houses,
      ): readonly Planets[] => {
        const referenceHouse = indexed.positionOf(referenceBody);
        const absoluteHouse = normalizeHouse(referenceHouse + relativeHouse - 1);
        const bodies = MutableHashMap.get(occupants, absoluteHouse);
        if (Option.isNone(bodies)) {
          throw new Error(`Missing house ${absoluteHouse} occupants in D${division}`);
        }
        return bodies.value;
      },
    };
    return Result.succeed(indexed);
  };

  return {
    calculation,
    forDivision: (division: Division) => {
      const cached = MutableHashMap.get(cache, division);
      if (Option.isSome(cached)) return cached.value;
      const built = buildDivision(division);
      MutableHashMap.set(cache, division, built);
      return built;
    },
  };
}

function requireDivision(index: EvaluationIndex, division: Division) {
  return Effect.suspend(() => {
    const result = index.forDivision(division);
    return Result.isSuccess(result) ? Effect.succeed(result.success) : Effect.fail(result.failure);
  });
}

export const evaluateCondition = Effect.fn("Yoga.evaluateCondition")(function* (
  condition: YogaCondition,
  index: EvaluationIndex,
): Effect.fn.Return<YogaEvidence, InvalidYogaEvidenceError> {
  return yield* Match.value(condition).pipe(
    Match.tag("BodyPositionsCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const referenceHouse = at.positionOf(condition.referenceBody);
        const observed = condition.bodies.map((body) => ({
          body,
          relativeHouse: normalizeHouse(at.positionOf(body) - referenceHouse + 1),
        }));
        const matches = observed.map(({ relativeHouse }) =>
          condition.expectedRelativeHouses.includes(relativeHouse),
        );
        return {
          _tag: "BodyPositionsEvidence" as const,
          division: condition.division,
          referenceBody: condition.referenceBody,
          bodies: condition.bodies,
          expectedRelativeHouses: condition.expectedRelativeHouses,
          observed,
          quantifier: condition.quantifier,
          matched: condition.quantifier === "All" ? matches.every(Boolean) : matches.some(Boolean),
        };
      }),
    ),
    Match.tag("BodyDignitiesCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const referenceHouse = at.positionOf(condition.referenceBody);
        const observed = condition.bodies.map((body) => ({
          body,
          relativeHouse: normalizeHouse(at.positionOf(body) - referenceHouse + 1),
          dignities: at.dignitiesOf(body),
        }));
        return {
          _tag: "BodyDignitiesEvidence" as const,
          division: condition.division,
          referenceBody: condition.referenceBody,
          bodies: condition.bodies,
          expectedRelativeHouses: condition.expectedRelativeHouses,
          expectedDignities: condition.expectedDignities,
          observed,
          quantifier: "All" as const,
          matched: observed.every(
            ({ relativeHouse, dignities }) =>
              condition.expectedRelativeHouses.includes(relativeHouse) &&
              dignities.some((dignity) => condition.expectedDignities.includes(dignity)),
          ),
        };
      }),
    ),
    Match.tag("OccupiedSignCountCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const observed = condition.bodies.map((body) => ({ body, sign: at.signOf(body) }));
        const observedSignCount = new Set(observed.map(({ sign }) => sign)).size;
        return {
          _tag: "OccupiedSignCountEvidence" as const,
          division: condition.division,
          bodies: condition.bodies,
          expectedSignCount: condition.expectedSignCount,
          observed,
          observedSignCount,
          matched: observedSignCount === condition.expectedSignCount,
        };
      }),
    ),
    Match.tag("SignModalityCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const observed = condition.bodies.map((body) => {
          const sign = at.signOf(body);
          return { body, sign, modality: signModality(sign) };
        });
        return {
          _tag: "SignModalityEvidence" as const,
          division: condition.division,
          bodies: condition.bodies,
          expectedModality: condition.expectedModality,
          observed,
          matched: observed.every(({ modality }) => modality === condition.expectedModality),
        };
      }),
    ),
    Match.tag("NaturalPlanetGroupPositionsCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const bodies = naturalMalefics;
        const referenceHouse = at.positionOf(condition.referenceBody);
        const observed = bodies.map((body) => ({
          body,
          relativeHouse: normalizeHouse(at.positionOf(body) - referenceHouse + 1),
        }));
        const matches = observed.map(({ relativeHouse }) =>
          condition.expectedRelativeHouses.includes(relativeHouse),
        );
        return {
          _tag: "NaturalPlanetGroupPositionsEvidence" as const,
          division: condition.division,
          referenceBody: condition.referenceBody,
          group: condition.group,
          bodies,
          expectedRelativeHouses: condition.expectedRelativeHouses,
          observed,
          quantifier: condition.quantifier,
          matched: condition.quantifier === "All" ? matches.every(Boolean) : matches.some(Boolean),
        };
      }),
    ),
    Match.tag("ContinuousSignWindowCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const startSign = at.signAtRelativeHouse(
          condition.referenceBody,
          condition.startingRelativeHouse,
        );
        const expectedSigns = consecutiveSigns(startSign, condition.signCount);
        const observed = condition.bodies.map((body) => ({ body, sign: at.signOf(body) }));
        return {
          _tag: "ContinuousSignWindowEvidence" as const,
          division: condition.division,
          referenceBody: condition.referenceBody,
          bodies: condition.bodies,
          startingRelativeHouse: condition.startingRelativeHouse,
          signCount: condition.signCount,
          expectedSigns,
          observed,
          matched: observed.every(({ sign }) => expectedSigns.includes(sign)),
        };
      }),
    ),
    Match.tag("HouseOccupancyCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const observed = condition.expectedRelativeHouses.map((relativeHouse) => ({
          relativeHouse,
          occupants: at.occupantsAtRelativeHouse(condition.referenceBody, relativeHouse),
        }));
        const occupied = observed.map(({ occupants }) =>
          occupants.some((body) => !condition.excludedBodies.includes(body)),
        );
        return {
          _tag: "HouseOccupancyEvidence" as const,
          division: condition.division,
          referenceBody: condition.referenceBody,
          expectedRelativeHouses: condition.expectedRelativeHouses,
          observed,
          excludedBodies: condition.excludedBodies,
          quantifier: condition.quantifier,
          matched:
            condition.quantifier === "EveryHouse"
              ? occupied.every(Boolean)
              : occupied.some(Boolean),
        };
      }),
    ),
    Match.tag("HouseLordPlacementCondition", (condition) =>
      Effect.gen(function* () {
        const at = yield* requireDivision(index, condition.division);
        const lord = rashiLord(
          at.signAtRelativeHouse(condition.referenceBody, condition.lordOfHouse),
        );
        const referenceHouse = at.positionOf(condition.referenceBody);
        const observedRelativeHouse = normalizeHouse(at.positionOf(lord) - referenceHouse + 1);
        return {
          _tag: "HouseLordPlacementEvidence" as const,
          division: condition.division,
          referenceBody: condition.referenceBody,
          lordOfHouse: condition.lordOfHouse,
          expectedRelativeHouses: condition.expectedRelativeHouses,
          observed: { lordOfHouse: condition.lordOfHouse, lord, observedRelativeHouse },
          matched: condition.expectedRelativeHouses.includes(observedRelativeHouse),
        };
      }),
    ),
    Match.tag("AllCondition", (condition) =>
      Effect.gen(function* () {
        const children = [];
        for (const child of condition.children) {
          children.push(yield* evaluateCondition(child, index));
        }
        return {
          _tag: "AllEvidence" as const,
          children,
          matched: children.every(({ matched }) => matched),
        };
      }),
    ),
    Match.tag("AnyCondition", (condition) =>
      Effect.gen(function* () {
        const children = [];
        for (const child of condition.children) {
          children.push(yield* evaluateCondition(child, index));
        }
        return {
          _tag: "AnyEvidence" as const,
          children,
          matched: children.some(({ matched }) => matched),
        };
      }),
    ),
    Match.tag("NotCondition", (condition) =>
      Effect.gen(function* () {
        const child = yield* evaluateCondition(condition.child, index);
        return { _tag: "NotEvidence" as const, child, matched: child.matched !== true };
      }),
    ),
    Match.exhaustive,
  );
});

export const evaluateDefinition = Effect.fn("Yoga.evaluateDefinition")(function* (
  definition: YogaDefinition,
  index: EvaluationIndex,
) {
  const evidence = yield* YogaStrategy.$match(definition.strategy, {
    Condition: ({ condition }) => evaluateCondition(condition, index),
    Evaluator: ({ evaluate }) => evaluate(index),
  });
  if (typeof evidence.matched !== "boolean" && evidence.matched !== null) {
    return yield* InvalidYogaEvidenceError.make({
      message: `Yoga ${definition.yoga.id} evaluator returned invalid evidence`,
      cause: new Error(`Yoga ${definition.yoga.id} evaluator returned invalid evidence`),
    });
  }
  return { yoga: definition.yoga, present: evidence.matched, evidence };
});
