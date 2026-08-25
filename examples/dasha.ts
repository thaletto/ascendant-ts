import { Config, Console, Effect, Layer } from "effect";
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
      Start: period.start,
      End: period.end,
    })),
  );

  for (const period of timeline) {
    yield* Console.log(
      `${period.mahadasha} Mahadasha Antardashas (${period.start} to ${period.end})`,
    );
    yield* Console.table(
      period.antardashas.map((antardasha) => ({
        Antardasha: antardasha.antardasha,
        Start: antardasha.start,
        End: antardasha.end,
      })),
    );
  }
});

const program = Effect.gen(function* () {
  const { date, latitude, longitude } = yield* config;
  const chart = yield* Chart.Service;
  const dasha = yield* Dasha.Service;
  const moment = new Chart.Moment({ date: new Date(date) });
  const calculation = yield* chart.generate(
    new Chart.LocatedMoment({ moment, latitude, longitude }),
  );
  yield* dasha.calculate(moment, calculation.placements).pipe(Effect.tap(printDasha));
});

const chartLayer = Chart.layer.pipe(
  Layer.provide(AstroParams.defaultLayer),
  Layer.provide(Swisseph.layer),
);
const runtimeLayer = Layer.mergeAll(chartLayer, Dasha.layer, DevTools.layer());

Effect.runPromise(program.pipe(Effect.provide(runtimeLayer))).catch((error) => {
  console.error(error);
});
