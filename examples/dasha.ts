import { BunRuntime } from "@effect/platform-bun";
import { Config, Console, DateTime, Effect, Layer } from "effect";
import { DevTools } from "effect/unstable/devtools";

import { AstroParams, Chart, Dasha } from "../src/index.ts";
import * as Swisseph from "../src/swisseph/index.ts";

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const printDasha = Effect.fn("Examples.printDasha")(function* (timeline: Dasha.VimshottariDasha) {
  yield* Console.log("Vimshottari Mahadashas");
  yield* Console.table(
    timeline.map((period) => ({
      Mahadasha: period.mahadasha,
      Start: DateTime.formatIso(period.start),
      End: DateTime.formatIso(period.end),
    })),
  );

  for (const period of timeline) {
    yield* Console.log(
      `${period.mahadasha} Mahadasha Antardashas (${DateTime.formatIso(period.start)} to ${DateTime.formatIso(period.end)})`,
    );
    yield* Console.table(
      period.antardashas.map((antardasha) => ({
        Antardasha: antardasha.antardasha,
        Start: DateTime.formatIso(antardasha.start),
        End: DateTime.formatIso(antardasha.end),
      })),
    );
  }
});

const program = Effect.gen(function* () {
  const { date, latitude, longitude } = yield* config;
  const moment = Chart.Moment.make({ date: DateTime.makeUnsafe(date) });
  const calculation = yield* Chart.generate(
    Chart.LocatedMoment.make({ moment, latitude, longitude }),
  );
  yield* Dasha.calculate(moment, calculation.placements).pipe(Effect.tap(printDasha));
});

const runtimeLayer = Layer.mergeAll(
  AstroParams.DefaultAstroParams,
  Swisseph.SwissephLayer,
  DevTools.layer(),
);

BunRuntime.runMain(program.pipe(Effect.provide(runtimeLayer)));
