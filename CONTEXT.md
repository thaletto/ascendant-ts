# Ascendant

A Vedic (Indian) astrology chart generator. Given a moment and geographic location, it computes the positions of the grahas and the resulting chart. Because positions are computed for arbitrary moments, the same machinery also produces transits.

## Language

**Chart**:
A snapshot of astrological positions at a given moment and geographic location, arranged into the twelve houses. It captures the house-planets-nakshatra relationship for that moment: each house holds its sign, the grahas placed in it, and (via the sign) its nakshatra. A chart built from a birth is a birth chart; a chart built from a later moment for comparison is a transit.
_Avoid_: Birth wheel, horoscope, kundali (unless the user specifically says these)

**Moment**:
The point in time at which planetary positions are computed. A chart is built from a birth Moment; a transit is computed at some other Moment (e.g. now) against that chart. A Moment is separate from configuration: it is per-computation input, not a setting.
_Avoid_: Time, timestamp, epoch (unless you mean something else)

**AstroParams**:
The parameters of the astrological computation: ayanamsa and house system. Separate from the Moment and the Birth; a chart is computed from a Birth plus the AstroParams.
_Avoid_: AstroConfig, settings, options, chart config

**Planet**:
A graha's placement in the chart: its longitude, sign, house, nakshatra, and retrograde state at the chart's moment. A Planet connects to the house it is in and the nakshatra it is in. The nakshatra a planet falls in (within its house) is what matters, so nakshatra lives on the Planet, not the Sign.
_Avoid_: Body, celestial body, position

**Sign**:
One of the twelve zodiac signs a graha can occupy: its name and lord. A sign spans several nakshatras, so it does not carry a nakshatra itself.
_Avoid_: Rashi, zodiac, star sign

**Relationship direction**:
All chart relationships are one-directional to keep the data small. A House lists its planets; a Planet does not carry a house reference. Connection back from planet to house is derived by scanning the chart.
_Avoid_: Two-way connections, back-references, cycles

**Ayanamsa**:
The sidereal reference frame used to align tropical longitudes to the fixed zodiac. Configurable: it is a per-chart input (e.g. Lahiri, Raman), not a fixed table.
_Avoid_: Reference frame, zodiac offset

**House system**:
The method for dividing the twelve houses (e.g. Whole Sign, Placidus). Configurable per chart, with a default.
_Avoid_: House division, cusps method

**Birth**:
The birth Moment plus the latitude and longitude where it occurred. Kept separate from configuration; a chart is computed from a Birth plus the chosen config (ayanamsa, house system).
_Avoid_: Birth data, birth info, birth details

**Rahu / Ketu**:
The lunar nodes, grahas that behave like planets in every way except sign ownership: they do not rule a sign.
_Avoid_: Node, shadow planet, Draco
