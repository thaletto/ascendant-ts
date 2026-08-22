import { Schema } from "effect";

export class ChartCalculationError extends Schema.TaggedError<ChartCalculationError>()(
  "ChartCalculationError",
  {
    stage: Schema.Literals(["validation", "placements", "mapping"]),
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}
