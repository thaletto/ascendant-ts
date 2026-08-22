import { Schema } from "effect";

export class DashaCalculationError extends Schema.TaggedError<DashaCalculationError>()(
  "DashaCalculationError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}

export class DashaTimelineError extends Schema.TaggedError<DashaTimelineError>()(
  "DashaTimelineError",
  {
    operation: Schema.Literals(["current", "mahadasha", "antardasha"]),
    cause: Schema.Defect(),
  },
) {}
