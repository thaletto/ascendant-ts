# astro-ascendant

`astro-ascendant` is an Effect-first Vedic astrology chart library. Given a Moment and geographic location, it calculates shared Placements, the D1/Rashi Chart, and requested divisional Charts.

The core package is runtime-neutral. Install `@swisseph/node` and import `astro-ascendant/swisseph` when using the bundled Node/Bun Swiss Ephemeris adapter.

```ts
import { AstroParams, Chart } from "astro-ascendant";
import * as Swisseph from "astro-ascendant/swisseph";
import { Effect, Layer } from "effect";

const chart = new Chart.LocatedMoment({
  moment: new Chart.Moment({ date: new Date("2000-01-01T12:00:00.000Z") }),
  latitude: 12.9716,
  longitude: 77.5946,
});

const program = Effect.gen(function* () {
  const service = yield* Chart.Service;
  return yield* service.generate(chart, [9]);
});

const layer = Chart.layer.pipe(
  Layer.provide(AstroParams.defaultLayer),
  Layer.provide(Swisseph.layer),
);
```

The package exports `astro-ascendant/chart`, `astro-ascendant/chart/divisional-mapping`, `astro-ascendant/ephemeris`, `astro-ascendant/astro-params`, and `astro-ascendant/swisseph` for focused imports.

For local development, use `bun run build`, `bun run test`, or `make check`. The basic executable example is `examples/basic.ts` and reads `MOMENT_DATE`, `LATITUDE`, and `LONGITUDE` from its runtime configuration.
