# 0001 — Chart relationships are one-directional, nakshatra lives on Planet

A Chart is the house-planets-nakshatra snapshot at a given moment. We decided that relationships in the model are one-directional to keep data small: a House lists its planets, but a Planet carries no house back-reference, and the house a planet sits in is derived by scanning the chart. Nakshatra is degree-based (a sign spans 2–3 nakshatras), so it lives on the Planet — the nakshatra a planet falls in — not on the Sign, which only carries name and lord.

The position computation is moment-generic: charts are computed for a birth Moment, and transits at other Moments, through the same machinery. Birth is a special case of Moment that adds latitude and longitude.

_Considered:_ two-way references between House and Planet (rejected — they bloat the data for no query benefit in this read-mostly model), and Sign-owned nakshatra (rejected — cannot represent a planet near a sign boundary; pada/degree pinning requires nakshatra at the placement, not the sign).
