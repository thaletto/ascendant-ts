# Ephemeris

This module defines the runtime-neutral ephemeris service used to obtain
planetary positions for a located moment.

The model exports describe ephemeris inputs and results. `EphemerisService`
is the abstraction consumed by chart generation; concrete implementations,
such as Swiss Ephemeris, are provided by adapter modules.
