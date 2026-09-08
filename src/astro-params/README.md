# Astro parameters

This module defines the configuration used when calculating a chart:
ayanamsa, house system, and related astronomical parameters.

`DefaultAstroParams` provides the package defaults. `AstroParams` is the
Effect service used by chart calculations, while the model exports provide
the supported parameter values and types.

The module is runtime-neutral and does not perform ephemeris calculations.
