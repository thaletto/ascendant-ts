import { Array, DateTime, HashSet, Record } from "effect";

import * as Model from "../../src/chart/index.js";

const RASHIS = Model.Rashis.literals;
const SIGN_LORDS: Record<Model.Rashis, Model.RashiLords> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};

const ALL_PLANETS = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
  "Rahu",
  "Ketu",
] as const;

function sourcePlanet(
  name: Model.Planets,
  longitude: number,
  isRetrograde = false,
): Model.SourcePlanet {
  return Model.SourcePlanet.make({
    name,
    longitude: Model.Longitude.make(longitude),
    is_retrograde: isRetrograde,
    nakshatra: Model.Nakshatra.make({ name: "Ashwini", lord: "Ketu", pada: 1 }),
  });
}

function placementsFromLongitudes(
  overrides: Partial<Record<Model.Planets, number>> = {},
  options: {
    readonly omit?: readonly Model.Planets[];
    readonly duplicate?: Model.Planets;
    readonly lagnaLongitude?: number;
  } = {},
): Model.Placements {
  const longitudes: Record<Model.Planets, number> = {
    Sun: 10,
    Moon: 40,
    Mars: 70,
    Mercury: 100,
    Jupiter: 130,
    Venus: 160,
    Saturn: 190,
    Rahu: 220,
    Ketu: 250,
    ...overrides,
  };
  const omitted = HashSet.fromIterable(options.omit ?? []);
  const planets = ALL_PLANETS.filter((planet) => !HashSet.has(omitted, planet)).map((planet) =>
    sourcePlanet(planet, longitudes[planet]),
  );
  if (options.duplicate !== undefined) {
    planets.push(sourcePlanet(options.duplicate, longitudes[options.duplicate]));
  }

  return Model.Placements.make({
    lagna: Model.SourceLagna.make({
      name: "Lagna",
      longitude: Model.Longitude.make(options.lagnaLongitude ?? 0),
      nakshatra: Model.Nakshatra.make({ name: "Ashwini", lord: "Ketu", pada: 1 }),
    }),
    planets,
  });
}

function planetForHouse(name: Model.Planets, house: Model.Houses): Model.Planet {
  const longitude = (house - 1) * 30;
  const sign = Array.getUnsafe(RASHIS, house - 1);
  return Model.Planet.make({
    name,
    longitude: Model.Longitude.make(longitude),
    degree: Model.Degree.make(0),
    is_retrograde: false,
    in_sign: [],
    sign: Model.Sign.make({ name: sign, lord: SIGN_LORDS[sign] }),
  });
}

function calculationFromHouses(
  overrides: Partial<Record<Model.Planets, Model.Houses>> = {},
  divisions: readonly Model.Division[] = [1],
): Model.ChartCalculation {
  const planetHouses: Record<Model.Planets, Model.Houses> = {
    Sun: 3,
    Moon: 5,
    Mars: 6,
    Mercury: 8,
    Jupiter: 9,
    Venus: 11,
    Saturn: 12,
    Rahu: 2,
    Ketu: 7,
    ...overrides,
  };
  const planets = ALL_PLANETS.map((name) => planetForHouse(name, planetHouses[name]));
  const houses = Record.fromEntries(
    RASHIS.map((sign, index) => {
      const house = (index + 1) as Model.Houses;
      return [
        String(house),
        Model.House.make({
          sign,
          planets: planets.filter((planet) => planetHouses[planet.name] === house),
          lagna:
            house === 1
              ? Model.Lagna.make({
                  name: "Lagna",
                  longitude: Model.Longitude.make(0),
                  degree: Model.Degree.make(0),
                  sign: Model.Sign.make({ name: "Aries", lord: "Mars" }),
                })
              : null,
        }),
      ];
    }),
  ) as Record<Model.Houses, Model.House>;
  const sourcePlacements = placementsFromLongitudes(
    Record.fromEntries(ALL_PLANETS.map((name) => [name, (planetHouses[name] - 1) * 30])) as Partial<
      Record<Model.Planets, number>
    >,
  );
  const charts = divisions.map((division) =>
    Model.Chart.make({
      provenance: { school: "Ascendant", method: "ascendant-divisional-mapping", version: "1" },
      division,
      houses,
    }),
  ) as [Model.Chart, ...Model.Chart[]];
  const bhavaHouses = Record.fromEntries(
    RASHIS.map((_, index) => {
      const house = (index + 1) as Model.Houses;
      const chartHouse = houses[house];
      if (chartHouse === undefined) throw new Error(`Missing fixture house ${house}`);
      return [
        String(house),
        Model.BhavaHouse.make({
          cusp: Model.Longitude.make(index * 30),
          planets: chartHouse.planets,
          lagna: chartHouse.lagna,
        }),
      ];
    }),
  ) as Record<Model.Houses, Model.BhavaHouse>;

  return Model.ChartCalculation.make({
    placements: sourcePlacements,
    charts,
    bhava: Model.BhavaChart.make({
      houses: bhavaHouses,
      angles: Model.BhavaAngles.make({
        ascendant: Model.CircleAngle.make(0),
        mc: Model.CircleAngle.make(0),
        armc: Model.CircleAngle.make(0),
        vertex: Model.CircleAngle.make(0),
        equatorialAscendant: Model.CircleAngle.make(0),
        coAscendant1: Model.CircleAngle.make(0),
        coAscendant2: Model.CircleAngle.make(0),
        polarAscendant: Model.CircleAngle.make(0),
      }),
    }),
    astroParams: { ayanamsa: "Lahiri", houseSystem: "WholeSign" },
  });
}

function moment(date = "2000-01-01T12:00:00.000Z"): Model.Moment {
  return Model.Moment.make({ date: DateTime.makeUnsafe(date) });
}

function locatedMoment(): Model.LocatedMoment {
  return Model.LocatedMoment.make({ moment: moment(), latitude: 12.9716, longitude: 77.5946 });
}

export const fixtures = {
  calculationFromHouses,
  locatedMoment,
  moment,
  placementsFromLongitudes,
  sourcePlanet,
};
