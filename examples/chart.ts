import { Console, Effect } from "effect";

import { AstroParams, Chart } from "../src/index.ts";
import { printChartCalculation } from "./chart-calculation-table.ts";
import type { ExampleInput } from "./input.ts";

export const chartExample = Effect.fn("Examples.chart")(function* ({
  moment,
  latitude,
  longitude,
}: ExampleInput) {
  const located = Chart.LocatedMoment.make({
    moment,
    latitude,
    longitude,
  });
  const vedicParams = AstroParams.Options.make({
    ayanamsa: "Lahiri",
    houseSystem: "WholeSign",
  });
  const kpParams = AstroParams.Options.make({
    ayanamsa: "KrishnamurtiVP291",
    houseSystem: "Placidus",
  });

  const vedicCalculation = yield* Chart.generate(located, [9]).pipe(
    Effect.provide(AstroParams.layer(vedicParams)),
  );
  yield* Console.log("Vedic D1 and D9 (Lahiri + WholeSign)");
  yield* printChartCalculation(vedicCalculation, {
    includeSignificators: false,
    includeRulingPlanets: false,
  });

  const kpCalculation = yield* Chart.generate(located, []).pipe(
    Effect.provide(AstroParams.layer(kpParams)),
  );
  yield* Console.log("");
  yield* Console.log("KP Chart D1 (KrishnamurtiVP291 + Placidus)");
  yield* printChartCalculation(kpCalculation);
});
