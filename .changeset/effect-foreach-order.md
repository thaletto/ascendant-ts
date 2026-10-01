---
"astro-ascendant": patch
---

Internal refactor only, no API changes: use `Effect.forEach` for concurrent traversals and `Array.sort` with `Order` combinators instead of native `Array#sort` / `Effect.all` over `Array#map`.
