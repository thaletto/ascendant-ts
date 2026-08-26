import { BunRuntime } from "@effect/platform-bun";
import { Config, Console, DateTime, Effect, Layer } from "effect";
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
  const moment = Chart.Moment.make({ date: DateTime.makeUnsafe(date) });
  const calculation = yield* Chart.generate(
    Chart.LocatedMoment.make({ moment, latitude, longitude }),
  );

  yield* Yoga.evaluateAll(calculation).pipe(Effect.tap(printYogas));
});

const runtimeLayer = Layer.mergeAll(
  AstroParams.DefaultAstroParams,
  Swisseph.SwissephLayer,
  DevTools.layer(),
);

BunRuntime.runMain(program.pipe(Effect.provide(runtimeLayer)));
