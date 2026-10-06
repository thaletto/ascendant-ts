---
"astro-ascendant": patch
---

Suppress retrograde flag for lunar nodes: Rahu and Ketu now always report `is_retrograde: false` instead of deriving it from mean-node speed. Backward motion is their normal state, so the permanent `R` is hidden by convention. Planet flags are unchanged.
