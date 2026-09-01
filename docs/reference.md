# Calculation and API reference

## Calculation workflows

Derive Dasha and Ashtakavarga from an existing chart without repeating ephemeris work:

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

Chara resolves Scorpio's Mars/Ketu and Aquarius's Saturn/Rahu co-lords by sign associations, then exact within-sign degree, then the traditional planet in an exact tie. Sthira returns its deterministic Brahma-strength scorecard.

## Method provenance

Every result that exposes provenance identifies its versioned `{ school, method, version }` record. `Provenance.methods` is the canonical registry of calculation steps and verification criteria for the implemented chart, Yoga, Jaimini, and sign-Dasha methods.

```typescript
import { Provenance } from "astro-ascendant";

const sthiraMethod = Provenance.methods.sthiraDasha;
console.log(sthiraMethod.provenance);
console.log(sthiraMethod.steps);
console.log(sthiraMethod.verification);
```

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

| Entry point                     | Contents                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------- |
| `astro-ascendant`               | `AstroParams`, `Chart`, `Dasha`, `Ephemeris`, `Provenance`, `SAV`, `Yoga`, and Jaimini namespaces |
| `astro-ascendant/chart`         | Chart models, generation, projection, and errors                                                  |
| `astro-ascendant/dasha`         | Vimshottari, Chara, and Sthira Dasha calculations and queries                                     |
| `astro-ascendant/provenance`    | Auditable calculation-method registry                                                             |
| `astro-ascendant/sav`           | Ashtakavarga calculation and models                                                               |
| `astro-ascendant/yoga`          | Yoga catalog, evaluation, and evidence formatting                                                 |
| `astro-ascendant/swisseph`      | Swiss Ephemeris adapter                                                                           |
| `astro-ascendant/astro-params`  | Calculation parameter models and layers                                                           |
| `astro-ascendant/argala`        | Jaimini Argala calculation                                                                        |
| `astro-ascendant/arudha-pada`   | Jaimini Arudha Pada calculation                                                                   |
| `astro-ascendant/chara-karakas` | Jaimini Chara Karaka calculation                                                                  |
| `astro-ascendant/karakamsha`    | Jaimini Karakamsha calculation                                                                    |
| `astro-ascendant/rashi-drishti` | Jaimini Rashi Drishti calculation                                                                 |
| `astro-ascendant/upapada`       | Jaimini Upapada calculation                                                                       |
