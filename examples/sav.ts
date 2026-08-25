import { Config, Console, Effect, Layer } from "effect";
import { DevTools } from "effect/unstable/devtools";

import { AstroParams, Chart, SAV } from "../src/index.ts";
import * as Swisseph from "../src/swisseph/index.ts";

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const printSAV = Effect.fn("Examples.printSAV")(function* (result: SAV.AshtakavargaResult) {
  yield* Console.log("Bhinnashtakavarga and Sarvashtakavarga");
  yield* Console.table(
    Chart.Rashis.literals.map((rashi) => ({
      Rashi: rashi,
      Sun: result.bhinna.Sun[rashi],
      Moon: result.bhinna.Moon[rashi],
      Mars: result.bhinna.Mars[rashi],
      Mercury: result.bhinna.Mercury[rashi],
      Jupiter: result.bhinna.Jupiter[rashi],
      Venus: result.bhinna.Venus[rashi],
      Saturn: result.bhinna.Saturn[rashi],
      Lagna: result.bhinna.Lagna[rashi],
      SAV: result.sarva[rashi],
    })),
  );

  yield* Console.log("Reduced Bhinnashtakavarga");
  yield* Console.table(
    Chart.Rashis.literals.map((rashi) => ({
      Rashi: rashi,
      Sun: result.reduced.Sun[rashi],
      Moon: result.reduced.Moon[rashi],
      Mars: result.reduced.Mars[rashi],
      Mercury: result.reduced.Mercury[rashi],
      Jupiter: result.reduced.Jupiter[rashi],
      Venus: result.reduced.Venus[rashi],
      Saturn: result.reduced.Saturn[rashi],
    })),
  );

  yield* Console.log("Shodhya Pinda");
  yield* Console.table(
    SAV.AshtakavargaPlanets.literals.map((planet) => ({
      Planet: planet,
      "Rashi Pinda": result.shodhya_pinda[planet].rashi_pinda,
      "Graha Pinda": result.shodhya_pinda[planet].graha_pinda,
      "Shodhya Pinda": result.shodhya_pinda[planet].shodhya_pinda,
    })),
  );

  yield* Console.log("Classical checksums");
  yield* Console.table([result.totals]);
});

const program = Effect.gen(function* () {
  const { date, latitude, longitude } = yield* config;
  const chart = yield* Chart.Service;
  const sav = yield* SAV.Service;
  const calculation = yield* chart.generate(
    new Chart.LocatedMoment({
      moment: new Chart.Moment({ date: new Date(date) }),
      latitude,
      longitude,
    }),
  );
  yield* sav.calculate(calculation.placements).pipe(Effect.tap(printSAV));
});

const chartLayer = Chart.layer.pipe(
  Layer.provide(AstroParams.defaultLayer),
  Layer.provide(Swisseph.layer),
);
const runtimeLayer = Layer.mergeAll(chartLayer, SAV.layer, DevTools.layer());

Effect.runPromise(program.pipe(Effect.provide(runtimeLayer))).catch((error) => {
  console.error(error);
});
