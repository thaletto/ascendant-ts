import { Config, Effect, Layer } from "effect";
import { DevTools } from "effect/unstable/devtools";
import { AstroParams, Chart } from "../src/index.ts";
import * as Swisseph from "../src/swisseph/index.ts";
import { printChartCalculation } from "./chart-calculation-table.ts";

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const program = Effect.gen(function* () {
  const { date, latitude, longitude } = yield* config;
  const chart = yield* Effect.service(Chart.Service);

  yield* chart
    .generate(
      new Chart.LocatedMoment({
        moment: new Chart.Moment({ date: new Date(date) }),
        latitude,
        longitude,
      }),
      [1, 9],
    )
    .pipe(Effect.tap(printChartCalculation));
});

const layer = Chart.layer.pipe(
  Layer.provide(AstroParams.defaultLayer),
  Layer.provide(Swisseph.layer),
);

const runtimeLayer = Layer.merge(layer, DevTools.layer());

Effect.runPromise(program.pipe(Effect.provide(runtimeLayer))).catch((error) => {
  console.error(error);
});
