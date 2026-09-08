# Swiss Ephemeris

This module adapts the native `@swisseph/node` package to the runtime-neutral
ephemeris service used by `astro-ascendant`.

Provide `SwissephLayer` to an Effect program that needs planetary positions.
The module also exports the adapter's models, helpers, calculations, and
domain errors.
