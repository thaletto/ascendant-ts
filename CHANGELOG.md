# astro-ascendant

## 3.0.0

### Major Changes

- 6c59872: Normalize `ChartProjection` provenance version from `"1"` (string) to `1` (int). All method provenances now use integer versions. This breaks consumers pinning the chart provenance identity.

### Minor Changes

- 6c59872: Add `Transit` module (`astro-ascendant/transit`): mechanics-only search for the next or previous transit events (`sign-ingress`, `longitude-hit`, `cusp-crossing`, `station`) of one graha from a located moment, with optional chart attachment per event.
- 8c79613: Replace internal `throw` and `Effect.die` sites with typed errors. Argala gains `ArgalaCalculationError`, Rashi Drishti gains `RashiDrishtiCalculationError`, and Sthira Dasha reports `DashaCalculationError`; previously-defective invariant failures are now recoverable through the error channel.

## 2.0.0

### Major Changes

- 19814b6: Change default ayanamsa from "Lahiri" to "Krishnamurti" and default house system from "WholeSign" to "Placidus".

## 1.0.1

### Patch Changes

- 8d964c8: Export the Swiss Ephemeris layer as `Swisseph` from the package root.
