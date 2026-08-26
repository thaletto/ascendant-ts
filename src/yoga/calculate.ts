import { Effect, Array, pipe, HashSet, Order, MutableHashSet, HashMap, Option } from "effect";

import type { ChartCalculation } from "../chart/model.js";
import { definitions as builtInDefinitions, makeCatalog } from "./catalog.js";
import {
  DuplicateYogaSelectionError,
  EmptyYogaSelectionError,
  MissingYogaEvidenceError,
  UnknownYogaError,
} from "./error.js";
import { evaluateDefinition, makeEvaluationIndex } from "./evaluate.js";
import type { YogaDefinition } from "./internal.js";
import type { YogaEvaluation, YogaId } from "./model.js";
import { provenance } from "./provenance.js";

export const getCatalog = Effect.fn("getCatalog")(function* (
  unvalidatedDefinitions: readonly YogaDefinition[] = builtInDefinitions,
) {
  const definitions = yield* makeCatalog(unvalidatedDefinitions);
  return Array.map(definitions, ({ yoga }) => yoga);
});

const missingEvidence = Effect.fn(function* (
  calculation: ChartCalculation,
  selected: readonly YogaDefinition[],
) {
  const available = pipe(
    calculation.charts,
    Array.map(({ division }) => division),
    HashSet.fromIterable,
  );
  const affectedYogaIds = pipe(
    selected,
    Array.filter(({ requiredDivisions }) =>
      requiredDivisions.some((division) => !HashSet.has(available, division)),
    ),
    Array.map(({ yoga }) => yoga.id),
  );

  if (affectedYogaIds.length === 0) return undefined;

  const missingDivisions = pipe(
    selected,
    Array.flatMap(({ requiredDivisions }) =>
      Array.filter(requiredDivisions, (division) => !HashSet.has(available, division)),
    ),
    HashSet.fromIterable,
    Array.sort(Order.Number),
  );
  return yield* MissingYogaEvidenceError.make({ affectedYogaIds, missingDivisions });
});

const evaluateYoga = Effect.fn("evaluateYoga")(function* (
  calculation: ChartCalculation,
  selected: readonly YogaDefinition[],
) {
  yield* missingEvidence(calculation, selected);

  const index = makeEvaluationIndex(calculation);
  const results = yield* Effect.all(
    selected.map((definition) => evaluateDefinition(definition, index)),
    { concurrency: 4 },
  );

  return { provenance, results } as YogaEvaluation;
});

export const evaluateAll = Effect.fn("evaluateAll")(function* (calculation: ChartCalculation) {
  const definitions = yield* makeCatalog(builtInDefinitions);
  return yield* evaluateYoga(calculation, definitions);
});

export const evaluateSelected = Effect.fn("evaluateSelected")(function* (
  calculation: ChartCalculation,
  ids: readonly YogaId[],
) {
  if (ids.length === 0) return yield* EmptyYogaSelectionError.make();

  const seen = MutableHashSet.empty<string>();
  const selected: YogaDefinition[] = [];
  const definitions = yield* makeCatalog(builtInDefinitions);
  const byId = pipe(
    definitions,
    Array.map((definition) => [definition.yoga.id, definition] as const),
    HashMap.fromIterable,
  );

  for (const id of ids) {
    const definitionOption = HashMap.get(byId, id);
    if (Option.isNone(definitionOption)) return yield* UnknownYogaError.make({ id });
    const definition = definitionOption.value;

    if (MutableHashSet.has(seen, id)) {
      return yield* DuplicateYogaSelectionError.make({ id: definition.yoga.id });
    }
    MutableHashSet.add(seen, id);
    selected.push(definition);
  }
  return yield* evaluateYoga(calculation, selected);
});
