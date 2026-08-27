import { Effect } from "effect";

import { Chart } from "../src/index.ts";
import { printChartCalculation } from "./chart-calculation-table.ts";
import type { ExampleInput } from "./input.ts";

export const chartExample = Effect.fn("Examples.chart")(function* ({
  moment,
  latitude,
  longitude,
}: ExampleInput) {
  yield* Chart.generate(
    Chart.LocatedMoment.make({
      moment,
      latitude,
      longitude,
    }),
    [9],
  ).pipe(Effect.tap(printChartCalculation));
});
