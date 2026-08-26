import { Context, Effect, Layer } from "effect";

import type { ChartCalculation } from "../internal/model.js";
import { getCatalog, evaluateAll, evaluateSelected } from "./calculate.js";
import {
  DuplicateYogaSelectionError,
  EmptyYogaSelectionError,
  InvalidYogaCatalogError,
  InvalidYogaEvidenceError,
  InvalidYogaServiceConfigurationError,
  MissingYogaEvidenceError,
  UnknownYogaError,
} from "./error.js";
import type { YogaDescriptor, YogaEvaluation, YogaId } from "./model.js";

type YogaErrors =
  | DuplicateYogaSelectionError
  | EmptyYogaSelectionError
  | InvalidYogaCatalogError
  | InvalidYogaEvidenceError
  | InvalidYogaServiceConfigurationError
  | MissingYogaEvidenceError
  | UnknownYogaError;

class Service extends Context.Service<
  Service,
  {
    readonly catalog: readonly YogaDescriptor[];
    readonly evaluateAll: (
      calculation: ChartCalculation,
    ) => Effect.Effect<YogaEvaluation, YogaErrors, never>;
    readonly evaluateSelected: (
      calculation: ChartCalculation,
      ids: readonly YogaId[],
    ) => Effect.Effect<YogaEvaluation, YogaErrors>;
  }
>()("astro-ascendant/yoga/service") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const catalog = yield* getCatalog();

    return Service.of({ catalog, evaluateAll, evaluateSelected });
  }),
);

export { Service as Yoga, layer as YogaLayer };
