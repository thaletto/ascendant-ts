# astro-ascendant

`astro-ascendant` is an Effect-first TypeScript library for Vedic astrology calculations. It calculates sidereal Placements, D1 and divisional Charts, Vimshottari Dasha timelines, and classical Parashari Ashtakavarga.

The library calculates planetary positions once for a Located Moment. Chart, Dasha, and SAV modules then share those Placements without repeating ephemeris work.

## Features

- **Shared Placements**: sidereal longitudes, motion states, nakshatras, and pada
- **Charts**: D1, 15 divisional Charts, and a configured Bhava chart from one calculation
- **Methodologies**: 39 predefined ayanamsas and 13 house systems
- **Vimshottari Dasha**: Mahadasha and Antardasha timelines with date queries
- **Ashtakavarga**: BAV, SAV, reduced BAV, and Shodhya Pinda
- **Yogas**: classical Yoga catalog with structured evidence and bounded concurrency
- **Effect integration**: named effects, typed context, layers, schemas, and domain errors
- **Runtime-neutral core**: use the bundled Node/Bun adapter or provide another Ephemeris adapter

## Installation

Install the library with its Effect peer dependency. Add the Swiss Ephemeris adapter when you run calculations in Node.js or Bun.

```bash
npm install astro-ascendant effect @swisseph/node
```

The package uses ES modules and ships TypeScript declarations.

## Calculate a chart

Create a Located Moment, provide the runtime layers once, and request the divisions you need. D1 is always included as the first Chart.

```typescript
import { BunRuntime } from "@effect/platform-bun";
import { AstroParams, Chart } from "astro-ascendant";
import * as Swisseph from "astro-ascendant/swisseph";
import { Console, DateTime, Effect, Layer } from "effect";

const moment = Chart.Moment.make({
  date: DateTime.makeUnsafe("2000-01-01T12:00:00.000Z"),
});
const input = Chart.LocatedMoment.make({
  moment,
  latitude: 12.9716,
  longitude: 77.5946,
});

const program = Chart.generate(input, [9, 10]);
const runtimeLayer = Layer.merge(AstroParams.DefaultAstroParams, Swisseph.SwissephLayer);

BunRuntime.runMain(program.pipe(Effect.provide(runtimeLayer)));
```

`calculation.placements` contains the shared source longitudes. `calculation.charts` contains D1, D9, and D10 in deterministic order. `calculation.bhava` contains the twelve cusp-defined houses and all eight house angles. `calculation.astroParams` records the resolved methodology used for the result.

## Derive Dasha and Ashtakavarga

Pass the shared Placements to the Dasha and SAV modules. Both calculations stay in process and do not call the Ephemeris adapter again.

```typescript
import { Dasha, SAV } from "astro-ascendant";

const derivedProgram = Effect.gen(function* () {
  const timeline = yield* Dasha.calculate(moment, calculation.placements);
  const current = yield* Dasha.at(timeline);
  const ashtakavarga = yield* SAV.calculate(calculation.placements);

  return { timeline, current, ashtakavarga };
});
```

`Dasha.at` queries the active Mahadasha and Antardasha with half-open UTC intervals. The SAV result contains these fields:

- `bhinna`: BAV tables for the 7 classical planets and Lagna
- `sarva`: the 12 SAV scores, excluding Lagna BAV
- `reduced`: Trikona and Ekadhipatya reduced planetary BAV tables
- `shodhya_pinda`: Rashi, Graha, and total Shodhya Pinda by planet
- `totals`: classical BAV checksums and the SAV total of 337

## Evaluate Yogas

Evaluate the built-in Yoga rule set against an existing Chart calculation. The module preflights the required divisions, then runs the definitions with bounded concurrency and returns structured evidence per definition.

```typescript
import { Yoga } from "astro-ascendant";

const yogaProgram = Effect.gen(function* () {
  const evaluation = yield* Yoga.evaluateAll(calculation);

  for (const { yoga: descriptor, present } of evaluation.results) {
    if (present) yield* Console.log(descriptor.name);
  }

  return yield* Yoga.evaluateSelected(calculation, [
    Yoga.YogaId.make("gajakesari"),
    Yoga.YogaId.make("sunapha"),
  ]);
});
```

`Yoga.catalog` lists every definition's descriptor without running any calculation. Unknown, duplicate, or empty selections and missing Chart divisions fail through the typed error channel before definitions start. Each result carries a `YogaEvidence` tree that `Yoga.formatEvidence` renders as text.

## Configure calculation parameters

`AstroParams.DefaultAstroParams` uses Lahiri ayanamsa and Whole Sign houses. Provide another layer for a different supported methodology.

```typescript
const paramsLayer = AstroParams.layer({
  ayanamsa: "Raman",
  houseSystem: "Placidus",
});
```

The Chart module produces sign-based D1 and divisional Charts, so their houses remain Whole Sign. The configured `houseSystem` changes only `calculation.bhava`; the shared Placements and sign-based Charts retain their own semantics.

### Supported ayanamsas

The stable public ayanamsa set follows the predefined Swiss Ephemeris identifiers:

`FaganBradley`, `Lahiri`, `DeLuce`, `Raman`, `Ushashashi`, `Krishnamurti`, `DjwhalKhul`, `Yukteshwar`, `JNBhasin`, `BabylKugler1`, `BabylKugler2`, `BabylKugler3`, `BabylHuber`, `BabylEtPSC`, `Aldebaran15Tau`, `Hipparchos`, `Sassanian`, `GalacticCenter0Sag`, `J2000`, `J1900`, `B1950`, `SuryaSiddhanta`, `SuryaSiddhantaMeanSun`, `Aryabhata`, `AryabhataMeanSun`, `SSRevati`, `SSCitra`, `TrueCitra`, `TrueRevati`, `TruePushya`, `GalacticCenterGilBrand`, `GalacticEquatorIAU1958`, `GalacticEquator`, `GalacticEquatorMidMula`, `Skydram`, `TrueMula`, `DhruvaGalCenterMulaWilhelm`, `Aryabhata522`, and `BabylBritton`.

`UserDefined` is not supported because it requires custom epoch and offset parameters that are outside the public AstroParams contract.

### Supported house systems

The supported house systems are `Placidus`, `Koch`, `Porphyrius`, `Regiomontanus`, `Campanus`, `Equal`, `VehlowEqual`, `WholeSign`, `Meridian`, `Azimuthal`, `PolichPage`, `Alcabitus`, and `Morinus`.

Some systems, including Placidus and Koch, cannot be calculated at certain polar latitudes. These cases fail through the typed Effect error channel; the adapter does not silently return a different house system.

## Supported divisions

The Chart module supports these divisions:

`D1`, `D2`, `D3`, `D4`, `D7`, `D9`, `D10`, `D12`, `D16`, `D20`, `D24`, `D27`, `D30`, `D40`, `D45`, and `D60`.

Duplicate requests are calculated once. The returned collection always begins with D1 and orders the remaining divisions numerically.

## Package exports

Import namespaces from the package root or use focused entry points:

| Import                                     | Purpose                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `astro-ascendant`                          | `AstroParams`, `Chart`, `Dasha`, `Ephemeris`, and `SAV` namespaces |
| `astro-ascendant/chart`                    | Chart models, schemas, errors, generation, and projection          |
| `astro-ascendant/dasha`                    | Vimshottari Dasha models, calculation, and UTC lookup              |
| `astro-ascendant/sav`                      | Ashtakavarga models, errors, and calculation                       |
| `astro-ascendant/yoga`                     | Yoga models, rule set, errors, evaluation, and evidence formatting |
| `astro-ascendant/astro-params`             | Calculation parameter models and layers                            |
| `astro-ascendant/ephemeris`                | Runtime-neutral ephemeris contract and models                      |
| `astro-ascendant/swisseph`                 | Swiss Ephemeris adapter for Node.js and Bun                        |
| `astro-ascendant/chart/divisional-mapping` | Focused divisional mapping functions                               |

## Examples

The executable examples first let you choose either environment configuration or interactive input:

```bash
make run
```

The environment option reads `MOMENT_DATE`, `LATITUDE`, and `LONGITUDE` from the process
environment, `.env.local`, `.env`, or `.env.test` (in that precedence order). If those values are
missing or invalid, the runner prints a concise error and continues with manual input. The input option
collects a `DD/MM/YYYY` date, 24-hour `HH:MM` time, and searchable IANA timezone. It then
offers presets for common Indian cities or manual latitude and longitude before presenting the
example selector.
The Jaimini example composes Chara Karakas, Rashi Drishti, Karakamsha, Arudha Pada,
Upapada, and Argala through their separately named operations.

## Development

Install dependencies and run the complete verification suite:

```bash
bun install
make check
```

Use `make help` to list the available development commands.

Run the non-gating Yoga benchmark with `bun run benchmark:yoga`; see
[benchmarks/README.md](benchmarks/README.md) for methodology and recent numbers.

## License

`astro-ascendant` is available under the [GNU Affero General Public License v3.0 or later](LICENSE).
