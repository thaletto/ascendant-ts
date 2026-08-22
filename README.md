# astro-ascendant

`astro-ascendant` is an Effect-first TypeScript library for Vedic astrology calculations. It calculates sidereal Placements, D1 and divisional Charts, Vimshottari Dasha timelines, and classical Parashari Ashtakavarga.

The library calculates planetary positions once for a Located Moment. Chart, Dasha, and SAV services then share those Placements without repeating ephemeris work.

## Features

- **Shared Placements**: sidereal longitudes, motion states, nakshatras, and pada
- **Charts**: D1, 15 divisional Charts, and a configured Bhava chart from one calculation
- **Methodologies**: 39 predefined ayanamsas and 13 house systems
- **Vimshottari Dasha**: Mahadasha and Antardasha timelines with date queries
- **Ashtakavarga**: BAV, SAV, reduced BAV, and Shodhya Pinda
- **Effect integration**: typed services, layers, schemas, and domain errors
- **Runtime-neutral core**: use the bundled Node/Bun adapter or provide another ephemeris service

## Installation

Install the library with its Effect peer dependency. Add the Swiss Ephemeris adapter when you run calculations in Node.js or Bun.

```bash
npm install astro-ascendant effect @swisseph/node
```

The package uses ES modules and ships TypeScript declarations.

## Calculate a chart

Create a Located Moment, provide the calculation layers, and request the divisions you need. D1 is always included as the first Chart.

```typescript
import { AstroParams, Chart } from "astro-ascendant";
import * as Swisseph from "astro-ascendant/swisseph";
import { Effect, Layer } from "effect";

const moment = new Chart.Moment({
  date: new Date("2000-01-01T12:00:00.000Z"),
});
const input = new Chart.LocatedMoment({
  moment,
  latitude: 12.9716,
  longitude: 77.5946,
});

const program = Effect.gen(function* () {
  const chart = yield* Chart.Service;
  return yield* chart.generate(input, [9, 10]);
});

const chartLayer = Chart.layer.pipe(
  Layer.provide(AstroParams.defaultLayer),
  Layer.provide(Swisseph.layer),
);
const calculation = await Effect.runPromise(program.pipe(Effect.provide(chartLayer)));
```

`calculation.placements` contains the shared source longitudes. `calculation.charts` contains D1, D9, and D10 in deterministic order. `calculation.bhava` contains the twelve cusp-defined houses and all eight house angles. `calculation.astroParams` records the resolved methodology used for the result.

## Derive Dasha and Ashtakavarga

Pass the shared Placements to the Dasha and SAV services. Both calculations stay in process and do not call the ephemeris adapter again.

```typescript
import { Dasha, SAV } from "astro-ascendant";

const derivedProgram = Effect.gen(function* () {
  const dasha = yield* Dasha.Service;
  const sav = yield* SAV.Service;

  const timeline = yield* dasha.calculate(moment, calculation.placements);
  const ashtakavarga = yield* sav.calculate(calculation.placements);

  return { timeline, ashtakavarga };
});

const derivedLayer = Layer.merge(Dasha.layer, SAV.layer);
const derived = await Effect.runPromise(derivedProgram.pipe(Effect.provide(derivedLayer)));
```

The Dasha service also provides `current`, `mahadasha`, and `antardasha` queries. The SAV result contains these fields:

- `bhinna`: BAV tables for the 7 classical planets and Lagna
- `sarva`: the 12 SAV scores, excluding Lagna BAV
- `reduced`: Trikona and Ekadhipatya reduced planetary BAV tables
- `shodhya_pinda`: Rashi, Graha, and total Shodhya Pinda by planet
- `totals`: classical BAV checksums and the SAV total of 337

## Configure calculation parameters

`AstroParams.defaultLayer` uses Lahiri ayanamsa and Whole Sign houses. Provide another layer for a different supported methodology.

```typescript
const paramsLayer = AstroParams.layer({
  ayanamsa: "Raman",
  houseSystem: "Placidus",
});
```

The Chart service produces sign-based D1 and divisional Charts, so their houses remain Whole Sign. The configured `houseSystem` changes only `calculation.bhava`; the shared Placements and sign-based Charts retain their own semantics.

For environment-driven applications, use `AstroParams.layerConfig(AstroParams.environmentConfig)`. It reads `AYANAMSA` and `HOUSE_SYSTEM`, with the same defaults as `defaultLayer`.

### Supported ayanamsas

The stable public ayanamsa set follows the predefined Swiss Ephemeris identifiers:

`FaganBradley`, `Lahiri`, `DeLuce`, `Raman`, `Ushashashi`, `Krishnamurti`, `DjwhalKhul`, `Yukteshwar`, `JNBhasin`, `BabylKugler1`, `BabylKugler2`, `BabylKugler3`, `BabylHuber`, `BabylEtPSC`, `Aldebaran15Tau`, `Hipparchos`, `Sassanian`, `GalacticCenter0Sag`, `J2000`, `J1900`, `B1950`, `SuryaSiddhanta`, `SuryaSiddhantaMeanSun`, `Aryabhata`, `AryabhataMeanSun`, `SSRevati`, `SSCitra`, `TrueCitra`, `TrueRevati`, `TruePushya`, `GalacticCenterGilBrand`, `GalacticEquatorIAU1958`, `GalacticEquator`, `GalacticEquatorMidMula`, `Skydram`, `TrueMula`, `DhruvaGalCenterMulaWilhelm`, `Aryabhata522`, and `BabylBritton`.

`UserDefined` is not supported because it requires custom epoch and offset parameters that are outside the public AstroParams contract.

### Supported house systems

The supported house systems are `Placidus`, `Koch`, `Porphyrius`, `Regiomontanus`, `Campanus`, `Equal`, `VehlowEqual`, `WholeSign`, `Meridian`, `Azimuthal`, `PolichPage`, `Alcabitus`, and `Morinus`.

Some systems, including Placidus and Koch, cannot be calculated at certain polar latitudes. These cases fail through the typed Effect error channel; the adapter does not silently return a different house system.

## Supported divisions

The Chart service supports these divisions:

`D1`, `D2`, `D3`, `D4`, `D7`, `D9`, `D10`, `D12`, `D16`, `D20`, `D24`, `D27`, `D30`, `D40`, `D45`, and `D60`.

Duplicate requests are calculated once. The returned collection always begins with D1 and orders the remaining divisions numerically.

## Package exports

Import namespaces from the package root or use focused entry points:

| Import                                     | Purpose                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `astro-ascendant`                          | `AstroParams`, `Chart`, `Dasha`, `Ephemeris`, and `SAV` namespaces |
| `astro-ascendant/chart`                    | Chart models, schemas, errors, service, and layer                  |
| `astro-ascendant/dasha`                    | Vimshottari Dasha models, errors, service, and layer               |
| `astro-ascendant/sav`                      | Ashtakavarga models, errors, service, and layer                    |
| `astro-ascendant/astro-params`             | Calculation parameter models and layers                            |
| `astro-ascendant/ephemeris`                | Runtime-neutral ephemeris contract and models                      |
| `astro-ascendant/swisseph`                 | Swiss Ephemeris adapter for Node.js and Bun                        |
| `astro-ascendant/chart/divisional-mapping` | Focused divisional mapping functions                               |

## Examples

The executable examples read `MOMENT_DATE`, `LATITUDE`, and `LONGITUDE` from the environment:

```bash
MOMENT_DATE=2000-01-01T12:00:00.000Z \
LATITUDE=12.9716 \
LONGITUDE=77.5946 \
bun run examples/chart.ts
```

Replace `chart.ts` with `dasha.ts` or `sav.ts` to print the corresponding tables.

## Development

Install dependencies and run the complete verification suite:

```bash
bun install
make check
```

Use `make help` to list the available development commands.

## License

`astro-ascendant` is available under the [GNU Affero General Public License v3.0 or later](LICENSE).
