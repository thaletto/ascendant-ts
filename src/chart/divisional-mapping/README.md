# Divisional mapping

This module maps a longitude to its position in a Vedic divisional chart.
It contains the supported division models, normalization helpers, and
division-specific errors.

Use `getDivisionalTarget` to resolve the target sign for a longitude and
division. `normalizeLongitude` keeps longitudes within the canonical
0-360-degree range.
