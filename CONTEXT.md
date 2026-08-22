# Ascendant

A Vedic (Indian) astrology chart generator. Given a moment and geographic location, it computes the positions of the grahas and the resulting chart. Because positions are computed for arbitrary moments, the same machinery also produces transits.

## Language

**Chart**:
A snapshot of astrological positions arranged into twelve houses. A Rashi or divisional Chart identifies its Division; D1 and the divisional charts are derived from the same Placements.
_Avoid_: Birth wheel, horoscope, kundali (unless the user specifically says these)

**Placements**:
The exact sidereal longitudes and motion states of the Lagna and grahas at a Located Moment. They are the common source from which the D1 and divisional charts are derived; Placements given natal meaning are natal placements.
_Avoid_: D1 chart, raw chart, base chart

**Division**:
The identity of a chart within the divisional system, written D1, D2, D3, and so on. D1 identifies the Rashi chart; the other supported values identify divisional charts.
_Avoid_: Chart type, Varga number

**D1 / Rashi chart**:
The sign-based D1 chart derived from Placements. Its twelve houses are counted from the Lagna sign; it is distinct from a Bhava chart.
_Avoid_: Base chart, raw chart

**Divisional chart**:
A sign-based chart derived from Placements by applying the mapping for its Division to the Lagna and grahas. Its twelve houses are counted from the resulting Lagna sign.
_Avoid_: Derived D1, harmonic chart

**Degree**:
A placement's position within its sign, from zero up to but not including thirty degrees. In D1 it is the source degree within the Rashi; in a divisional chart it is the degree produced by the divisional mapping.
_Avoid_: Absolute longitude, source longitude

**Bhava chart**:
A house-cusp representation produced using a configured House system. It is separate from the D1 / Rashi chart and from divisional charts.
_Avoid_: D1, Rashi chart

**Chart calculation**:
The D1 and requested divisional charts derived together from the same Placements. A Chart calculation always contains D1; one given natal meaning is a natal calculation.
_Avoid_: Chart bundle, chart pack

**Moment**:
The point in time at which planetary positions are computed. It may represent a birth, a transit, or another event. A Moment is separate from configuration: it is per-computation input, not a setting.
_Avoid_: Time, timestamp, epoch (unless you mean something else)

**Located Moment**:
A Moment paired with the latitude and longitude at which Placements are calculated. It is the canonical input for any Chart calculation and may be given natal, transit, or other event meaning.
_Avoid_: Birth, birth data, chart input, event data

**AstroParams**:
The parameters of the astrological computation: ayanamsa and house system. Separate from the Moment and location; the house system applies to a Bhava chart, not to D1 or divisional charts.
_Avoid_: AstroConfig, settings, options, chart config

**Planet**:
A graha's mapped placement in a Chart: its longitude, Degree, sign, dignity, and inherited retrograde state. Its longitude and Degree belong to that Chart's Division; the source nakshatra and pada remain on the Placements from which the Chart was derived.
_Avoid_: Body, celestial body, position

**Nakshatra placement**:
The nakshatra and pada determined by a graha's source sidereal longitude. It belongs to Placements and is not recalculated from a divisional Chart's mapped longitude.
_Avoid_: Divisional nakshatra, Sign nakshatra

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
The method for dividing a Bhava chart into twelve houses (e.g. Whole Sign, Placidus). It does not change the sign-based houses of D1 or divisional charts.
_Avoid_: House division, cusps method

**Rahu / Ketu**:
The lunar nodes, grahas that behave like planets in every way except sign ownership: they do not rule a sign.
_Avoid_: Node, shadow planet, Draco
