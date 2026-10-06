---
"astro-ascendant": patch
---

Fix Vimshottari sequence starting from the wrong Mahadasha lord: the nakshatra-lord rotation used Effect's `Array.rotate` with the wrong direction (positive `n` rotates right), so a Moon in Bharani (Venus) produced a Mercury-led timeline instead of Venus-led. Both Mahadasha and Antardasha ordering now use an explicit left rotation from the Moon's nakshatra lord.
