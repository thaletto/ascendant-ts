# astro-ascendant

[![npm version](https://img.shields.io/npm/v/astro-ascendant)](https://www.npmjs.com/package/astro-ascendant)
[![License](https://img.shields.io/badge/license-AGPL--3.0--or--later-blue.svg)](LICENSE)

Effect-first TypeScript library for sidereal Vedic astrology calculations.

`astro-ascendant` calculates planetary Placements once for a Located Moment, then derives charts, Vimshottari, Chara, and Sthira Dasha timelines, Ashtakavarga, Yogas, and Jaimini results from that shared calculation. It includes a Swiss Ephemeris adapter for Node.js and Bun, plus a runtime-neutral ephemeris interface for custom adapters.

## Installation

Install the package and its Effect peer dependency:

```bash
npm install astro-ascendant effect
```

The package includes the Swiss Ephemeris adapter dependency, uses ES modules, and includes TypeScript declarations.

## Quick start

This example generates a D1 and D9 chart for a birth moment in Bengaluru. `SwissephLayer` supplies the ephemeris implementation, while `DefaultAstroParams` selects Lahiri ayanamsa and Whole Sign houses.

```typescript
import { AstroParams, Chart } from "astro-ascendant";
import * as Swisseph from "astro-ascendant/swisseph";
import { DateTime, Effect, Layer } from "effect";

const input = Chart.LocatedMoment.make({
  moment: Chart.Moment.make({
    date: DateTime.makeUnsafe("2000-01-01T12:00:00.000Z"),
  }),
  latitude: 12.9716,
  longitude: 77.5946,
});

const program = Chart.generate(input, [9]);
const layers = Layer.merge(AstroParams.DefaultAstroParams, Swisseph.SwissephLayer);
const calculation = await Effect.runPromise(program.pipe(Effect.provide(layers)));

console.log(calculation.charts[0]); // D1
console.log(calculation.charts[1]); // D9
```

`calculation.placements` contains the shared sidereal positions. `calculation.charts` contains D1 first, followed by the requested divisions in numeric order. `calculation.bhava` contains the cusp-defined house projection.

## Calculations

The package exposes named operations for each calculation surface:

- **Charts**: D1 and 15 divisional charts, plus a configured Bhava chart
- **Dasha**: Vimshottari planetary periods plus Jaimini Chara and Sthira sign periods with date queries
- **Ashtakavarga**: Bhinnashtakavarga, Sarvashtakavarga, reduced BAV, and Shodhya Pinda
- **Yogas**: versioned classical Yoga catalog with structured evidence
- **Jaimini**: Chara Karakas, Rashi Drishti, Karakamsha, Arudha Pada, Upapada, and Argala
- **Methodologies**: 39 predefined ayanamsas and 13 house systems

For example, derive Dasha and Ashtakavarga from an existing chart without repeating ephemeris work:

```typescript
import { Dasha, SAV } from "astro-ascendant";

const derived = Effect.gen(function* () {
  const timeline = yield* Dasha.calculate(input.moment, calculation.placements);
  const current = yield* Dasha.at(timeline, input.moment.date);
  const chara = yield* Dasha.calculateChara(input.moment, calculation.placements);
  const sthira = yield* Dasha.calculateSthira(input.moment, calculation.placements);
  const currentRashi = yield* Dasha.atRashi(chara, input.moment.date);
  const ashtakavarga = yield* SAV.calculate(calculation.placements);

  return { timeline, current, chara, sthira, currentRashi, ashtakavarga };
});
```

Chara deterministically resolves Scorpio's Mars/Ketu and Aquarius's Saturn/Rahu co-lords: it uses the co-lord with more sign associations, then the higher exact within-sign degree, then the traditional planet in an exact tie. Sthira deterministically selects Brahma using its returned strength scorecard.

## Configuration

Pass an `AstroParams` layer to select the ayanamsa and house system:

```typescript
const params = AstroParams.layer({
  ayanamsa: "Raman",
  houseSystem: "Placidus",
});
```

The configured house system changes `calculation.bhava`. D1 and divisional charts remain sign-based charts with Whole Sign houses.

Supported divisions are `D1`, `D2`, `D3`, `D4`, `D7`, `D9`, `D10`, `D12`, `D16`, `D20`, `D24`, `D27`, `D30`, `D40`, `D45`, and `D60`.

## Package exports

Use the package root for the main namespaces, or import a focused entry point:

| Entry point                     | Contents                                                                            |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `astro-ascendant`               | `AstroParams`, `Chart`, `Dasha`, `Ephemeris`, `SAV`, `Yoga`, and Jaimini namespaces |
| `astro-ascendant/chart`         | Chart models, generation, projection, and errors                                    |
| `astro-ascendant/dasha`         | Vimshottari, Chara, and Sthira Dasha calculations and queries                       |
| `astro-ascendant/sav`           | Ashtakavarga calculation and models                                                 |
| `astro-ascendant/yoga`          | Yoga catalog, evaluation, and evidence formatting                                   |
| `astro-ascendant/swisseph`      | Swiss Ephemeris adapter                                                             |
| `astro-ascendant/astro-params`  | Calculation parameter models and layers                                             |
| `astro-ascendant/argala`        | Jaimini Argala calculation                                                          |
| `astro-ascendant/arudha-pada`   | Jaimini Arudha Pada calculation                                                     |
| `astro-ascendant/chara-karakas` | Jaimini Chara Karaka calculation                                                    |
| `astro-ascendant/karakamsha`    | Jaimini Karakamsha calculation                                                      |
| `astro-ascendant/rashi-drishti` | Jaimini Rashi Drishti calculation                                                   |
| `astro-ascendant/upapada`       | Jaimini Upapada calculation                                                         |

See the [API documentation](https://ascendant-docs.vercel.app) for the complete public surface and methodology details.

## Run the examples

The repository includes interactive examples for charts, Dasha, Jaimini, Ashtakavarga, and Yogas:

```bash
bun install
make run
```

The runner accepts `MOMENT_DATE`, `LATITUDE`, and `LONGITUDE` from the environment or lets you enter the moment and location interactively.

## Development

Run the full local verification suite:

```bash
bun install
make check
```

Use `make help` to list all available commands. Run the non-gating Yoga benchmark with `bun run benchmark:yoga`; its methodology is documented in [benchmarks/README.md](benchmarks/README.md).

## License

`astro-ascendant` is available under the [GNU Affero General Public License v3.0 or later](LICENSE).
