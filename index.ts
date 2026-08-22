import { Config, Console, Effect, Layer } from "effect";
import { ChartService } from "./src/chart";
import { AstroParams } from "./src/config/astro-params";
import { Ephemeris } from "./src/ephemeris/service";
import { LocatedMoment, Moment } from "./src/types";

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const program = config.pipe(
  Effect.flatMap(({ date, latitude, longitude }) =>
    Effect.gen(function* () {
      const chartService = yield* ChartService;
      const locatedMoment = new LocatedMoment({
        moment: new Moment({ date: new Date(date) }),
        latitude,
        longitude,
      });
      const calculation = yield* chartService.generate(locatedMoment);
      yield* Console.log(calculation);
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
