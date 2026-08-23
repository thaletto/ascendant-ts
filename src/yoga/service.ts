import { Context, Effect, Layer } from "effect";
import type { ChartCalculation } from "../chart/model.js";
import {
  catalog as publicCatalog,
  definitions as builtInDefinitions,
  makeCatalog,
} from "./catalog.js";
import {
  DuplicateYogaSelectionError,
  EmptyYogaSelectionError,
  InvalidYogaServiceConfigurationError,
  MissingYogaEvidenceError,
  UnknownYogaError,
  type YogaEvaluationError,
  type YogaSelectionError,
} from "./error.js";
import { evaluateDefinition, makeEvaluationIndex } from "./evaluate.js";
import type { EvaluationIndex, ServiceOptions, YogaDefinition } from "./internal.js";
import type { YogaDescriptor, YogaEvaluation } from "./model.js";

const provenance = { method: "ascendant-yoga", version: 1 } as const;

export interface Service {
  readonly catalog: readonly YogaDescriptor[];
  readonly evaluateAll: (
    calculation: ChartCalculation,
  ) => Effect.Effect<YogaEvaluation, YogaEvaluationError>;
  readonly evaluateSelected: (
    calculation: ChartCalculation,
    ids: readonly string[],
  ) => Effect.Effect<YogaEvaluation, YogaSelectionError>;
}

export const Service = Context.Service<Service>("astro-ascendant/yoga/Service");

function missingEvidence(
  calculation: ChartCalculation,
  selected: readonly YogaDefinition[],
): MissingYogaEvidenceError | undefined {
  const available = new Set(calculation.charts.map(({ division }) => division));
  const affectedYogaIds = selected
    .filter(({ requiredDivisions }) =>
      requiredDivisions.some((division) => !available.has(division)),
    )
    .map(({ yoga }) => yoga.id);
  if (affectedYogaIds.length === 0) return undefined;

  const missingDivisions = Array.from(
    new Set(
      selected.flatMap(({ requiredDivisions }) =>
        requiredDivisions.filter((division) => !available.has(division)),
      ),
    ),
  ).sort((left, right) => left - right);
  return new MissingYogaEvidenceError({ affectedYogaIds, missingDivisions });
}

export function makeLayer(
  unvalidatedDefinitions: readonly YogaDefinition[] = builtInDefinitions,
  options: ServiceOptions = {},
) {
  return Layer.effect(
    Service,
    Effect.gen(function* () {
      const hooks = options.hooks;
      const concurrency = options.concurrency ?? 4;
      if (!Number.isInteger(concurrency) || concurrency < 1) {
        return yield* new InvalidYogaServiceConfigurationError({ concurrency });
      }
      const definitions = yield* makeCatalog(unvalidatedDefinitions);
      const descriptors = Object.freeze(definitions.map(({ yoga }) => yoga));
      const byId = new Map<string, YogaDefinition>(
        definitions.map((definition) => [definition.yoga.id, definition]),
      );

      const evaluateRule = Effect.fn("Yoga.evaluateRule")(function* (
        definition: YogaDefinition,
        index: EvaluationIndex,
      ) {
        if (hooks !== undefined) yield* hooks.onStart(definition.yoga.id);
        const evaluated = evaluateDefinition(definition, index);
        return yield* hooks === undefined
          ? evaluated
          : evaluated.pipe(Effect.ensuring(hooks.onFinish(definition.yoga.id)));
      });

      const evaluate = Effect.fn("Yoga.evaluate")(function* (
        calculation: ChartCalculation,
        selected: readonly YogaDefinition[],
      ) {
        const evidenceError = missingEvidence(calculation, selected);
        if (evidenceError !== undefined) return yield* evidenceError;

        const index = makeEvaluationIndex(calculation);
        const results = yield* Effect.all(
          selected.map((definition) => evaluateRule(definition, index)),
          { concurrency },
        );
        return { provenance, results };
      });

      const evaluateAll = Effect.fn("Yoga.evaluateAll")((calculation: ChartCalculation) =>
        evaluate(calculation, definitions),
      );

      const evaluateSelected = Effect.fn("Yoga.evaluateSelected")(function* (
        calculation: ChartCalculation,
        ids: readonly string[],
      ) {
        if (ids.length === 0) return yield* new EmptyYogaSelectionError();
        const seen = new Set<string>();
        const selected: YogaDefinition[] = [];
        for (const id of ids) {
          const definition = byId.get(id);
          if (definition === undefined) return yield* new UnknownYogaError({ id });
          if (seen.has(id)) {
            return yield* new DuplicateYogaSelectionError({ id: definition.yoga.id });
          }
          seen.add(id);
          selected.push(definition);
        }
        return yield* evaluate(calculation, selected);
      });

      return Service.of({ catalog: descriptors, evaluateAll, evaluateSelected });
    }),
  );
}

export const layer = makeLayer();
export const catalog = publicCatalog;
