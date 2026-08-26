import { BunRuntime } from "@effect/platform-bun";
import { Config, DateTime, Effect, Layer } from "effect";
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

  yield* Chart.generate(
    Chart.LocatedMoment.make({
      moment: Chart.Moment.make({ date: DateTime.makeUnsafe(date) }),
      latitude,
      longitude,
    }),
    [9],
  ).pipe(Effect.tap(printChartCalculation));
});

const runtimeLayer = Layer.mergeAll(
  AstroParams.DefaultAstroParams,
  Swisseph.SwissephLayer,
  DevTools.layer(),
);

BunRuntime.runMain(program.pipe(Effect.provide(runtimeLayer)));
