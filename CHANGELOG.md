# astro-ascendant

## 3.2.0

### Minor Changes

- f35447f: Add missing Swiss Ephemeris ayanamsas (IDs 39-46) and default to KrishnamurtiVP291

## 3.1.0

### Minor Changes

- bbcc7d4: Calculate Rahu with the mean lunar node instead of the true/osculating node. Ketu remains exactly opposite Rahu. This shifts node longitudes by up to ~2 degrees, which can change signs, nakshatras, and dasha balance in existing charts and transits.

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
