---
"astro-ascendant": patch
---

Consolidate shared helpers into `src/utils`: one zodiac conversion hub with a branded `RashiIndex`, one exactly-once placement lookup, and the former `src/position` Effect boundary moved in. Removes duplicated rotation, distance, sign-lookup, and placement-validation helpers across dasha, Jaimini, SAV, chart, and transit. Standardizes `Effect.fn` trace names to `astro-ascendant/<module>/<fn>`, maps invalid longitudes to `DivisionalMappingError`, and fixes Upapada error propagation so unknown channels no longer leak
