import { Config, Console, Effect, Layer } from "effect";
import { DevTools } from "effect/unstable/devtools";

import { AstroParams, Chart, Yoga } from "../src/index.ts";
import * as Swisseph from "../src/swisseph/index.ts";

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const printYogas = Effect.fn("Examples.printYogas")(function* (evaluation: Yoga.YogaEvaluation) {
  yield* Console.log(`Yoga Catalog (${evaluation.results.length} rules evaluated)`);
  yield* Console.table(
    evaluation.results.map(({ yoga, present }) => ({
      ID: yoga.id,
      Name: yoga.name,
      Classification: yoga.classification,
      Present: present ? "Yes" : "No",
    })),
  );

  for (const { yoga, evidence } of evaluation.results) {
    // if (!present) continue;
    yield* Console.log(`${yoga.name}: ${Yoga.formatEvidence(evidence)}\n`);
  }
});

const program = Effect.gen(function* () {
  const { date, latitude, longitude } = yield* config;
  const chart = yield* Chart.Service;
  const yoga = yield* Yoga.Service;
  const moment = new Chart.Moment({ date: new Date(date) });
  const calculation = yield* chart.generate(
    new Chart.LocatedMoment({ moment, latitude, longitude }),
  );

  yield* yoga.evaluateAll(calculation).pipe(Effect.tap(printYogas));
});

const chartLayer = Chart.layer.pipe(
  Layer.provide(AstroParams.defaultLayer),
  Layer.provide(Swisseph.layer),
);
const runtimeLayer = Layer.mergeAll(chartLayer, Yoga.layer, DevTools.layer());

Effect.runPromise(program.pipe(Effect.provide(runtimeLayer))).catch((error) => {
  console.error(error);
});
