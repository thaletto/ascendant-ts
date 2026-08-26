import { Schema } from "effect";

export class DashaCalculationError extends Schema.TaggedError<DashaCalculationError>()(
  "DashaCalculationError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}
