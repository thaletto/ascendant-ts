import { Config, Console, Effect, Layer } from "effect";
import { ChartService } from "./src/chart";
import { AstroParams } from "./src/config/astro-params";
import { Ephemeris } from "./src/ephemeris/service";
import { Birth, Moment } from "./src/types";

const config = Effect.gen(function* () {
  const date = yield* Config.string("BIRTH_DATE");
  const latitude = yield* Config.number("BIRTH_LATITUDE");
  const longitude = yield* Config.number("BIRTH_LONGITUDE");
  return { date, latitude, longitude };
});

const program = config.pipe(
  Effect.flatMap(({ date, latitude, longitude }) =>
    Effect.gen(function* () {
      const chartService = yield* ChartService;
      const birth = new Birth({
        moment: new Moment({ date: new Date(date) }),
        latitude,
        longitude,
      });
      const chart = yield* chartService.generate(birth);
      yield* Console.log(chart);
    }),
  ),
);

const appLayer = ChartService.layer.pipe(
  Layer.provideMerge(AstroParams.layer),
  Layer.provideMerge(Ephemeris.layer),
);

Effect.runPromise(program.pipe(Effect.provide(appLayer))).catch((error) => {
  console.error(error);
});
