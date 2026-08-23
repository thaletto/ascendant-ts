import { Schema } from "effect";
import { Division } from "../chart/model.js";
import { YogaIds } from "./model.js";

export class UnknownYogaError extends Schema.TaggedError<UnknownYogaError>()("UnknownYogaError", {
  id: Schema.String,
}) {}

export class EmptyYogaSelectionError extends Schema.TaggedError<EmptyYogaSelectionError>()(
  "EmptyYogaSelectionError",
  {},
) {}

export class DuplicateYogaSelectionError extends Schema.TaggedError<DuplicateYogaSelectionError>()(
  "DuplicateYogaSelectionError",
  { id: YogaIds },
) {}

export class MissingYogaEvidenceError extends Schema.TaggedError<MissingYogaEvidenceError>()(
  "MissingYogaEvidenceError",
  {
    affectedYogaIds: Schema.Array(YogaIds),
    missingDivisions: Schema.Array(Division),
  },
) {}

export const InvalidYogaCatalogIssues = Schema.Literals([
  "DuplicateId",
  "DuplicateAlias",
  "EmptyAlias",
  "EmptyDivisions",
  "InvalidDivision",
  "DuplicateDivision",
  "DivisionMismatch",
] as const);

export class InvalidYogaCatalogError extends Schema.TaggedError<InvalidYogaCatalogError>()(
  "InvalidYogaCatalogError",
  {
    yogaId: Schema.String,
    issue: InvalidYogaCatalogIssues,
    detail: Schema.String,
  },
) {}

export class InvalidYogaServiceConfigurationError extends Schema.TaggedError<InvalidYogaServiceConfigurationError>()(
  "InvalidYogaServiceConfigurationError",
  { concurrency: Schema.Finite },
) {}

export class InvalidYogaEvidenceError extends Schema.TaggedError<InvalidYogaEvidenceError>()(
  "InvalidYogaEvidenceError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}

export type YogaEvaluationError = MissingYogaEvidenceError | InvalidYogaEvidenceError;

export type YogaSelectionError =
  | EmptyYogaSelectionError
  | UnknownYogaError
  | DuplicateYogaSelectionError
  | YogaEvaluationError;
