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

export type YogaSelectionError =
  | EmptyYogaSelectionError
  | UnknownYogaError
  | DuplicateYogaSelectionError
  | MissingYogaEvidenceError;
