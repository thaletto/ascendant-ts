import { DateTime, Effect, Record, Schema } from "effect";
import type { DateTime as DateTimeType } from "effect/DateTime";

import type { HouseData } from "../ephemeris/model.js";
import { distributePlanets, forwardDistance, normalizeAngle } from "./cusp.js";
import { getDivisionalTarget } from "./divisional-mapping/index.js";
import { ChartCalculationError } from "./error.js";
import { nakshatraOf, subLordOf } from "./helper.js";
import { RASHIS, SIGN_LORDS } from "./internal/constants.js";
import {
  ChartAngles,
  Chart,
  ChartHouses,
  CircleAngle,
  HouseSignificators,
  House,
  Houses,
  type Lagna,
  Longitude,
  HOUSE_SIGNIFICATIONS,
  type Planet,
  PlanetSignification,
  Planets,
  type Rashis,
} from "./model.js";

const HOUSE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const PLANET_NAMES = Planets.literals;

function houseOfPlanet(planet: Planets, houses: readonly House[]): Houses | undefined {
  const index = houses.findIndex((house) => house.planets.some((item) => item.name === planet));
  return index === -1 ? undefined : ((index + 1) as Houses);
}

function ownedHouses(planet: Planets, houses: readonly House[]): readonly Houses[] {
  return houses.flatMap((house, index) => {
    const sign = RASHIS[Math.floor(Number(house.cusp) / 30)] as Rashis | undefined;
    return sign !== undefined && SIGN_LORDS[sign] === planet ? [(index + 1) as Houses] : [];
  });
}

function starLordOf(planet: Planet): Planets {
  return nakshatraOf(planet.longitude).lord;
}

function planetsInStarOf(starLord: Planets, planets: readonly Planet[]): readonly Planets[] {
  return planets.flatMap((planet) => (starLordOf(planet) === starLord ? [planet.name] : []));
}

function dayLord(date: DateTimeType): Planets {
  const weekdays: readonly Planets[] = [
    "Sun",
    "Moon",
    "Mars",
    "Mercury",
    "Jupiter",
    "Venus",
    "Saturn",
  ];
  return weekdays[DateTime.toDate(date).getUTCDay()]!;
}

function signLordOf(longitude: Longitude): Planets {
  const sign = RASHIS[Math.floor(Number(longitude) / 30)] as Rashis;
  return SIGN_LORDS[sign];
}

function angularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function agentOf(planet: Planet, houses: readonly House[]): Planets | undefined {
  if (planet.name !== "Rahu" && planet.name !== "Ketu") return undefined;

  const house = houses.find((item) => item.planets.some(({ name }) => name === planet.name));
  const conjunction = house?.planets
    .filter((item) => item.name !== planet.name)
    .sort(
      (first, second) =>
        angularDistance(first.longitude, planet.longitude) -
        angularDistance(second.longitude, planet.longitude),
    )[0];

  return conjunction?.name ?? planet.sign.lord;
}

function calculateSignifications(
  houses: Readonly<Record<Houses, House>>,
  lagna: Lagna,
  date: DateTimeType,
) {
  const houseEntries = HOUSE_NUMBERS.map((house) => [house, houses[house]] as const);
  const allHouses = houseEntries.map(([, house]) => house);
  const planets = allHouses.flatMap((house) => house.planets);
  const byName = new Map(planets.map((planet) => [planet.name, planet] as const));
  const significations = PLANET_NAMES.map((planet) => {
    const item = byName.get(planet);
    const agent = item === undefined ? undefined : agentOf(item, allHouses);
    const effectivePlanet = agent ?? planet;
    const source = agent === undefined ? item : byName.get(agent);
    const starLord = source === undefined ? undefined : starLordOf(source);
    return [
      planet,
      PlanetSignification.make({
        planet,
        ...(agent === undefined ? {} : { agent }),
        level1:
          starLord === undefined
            ? []
            : ([houseOfPlanet(starLord, allHouses)].filter(
                (house): house is Houses => house !== undefined,
              ) as Houses[]),
        level2: [houseOfPlanet(effectivePlanet, allHouses)].filter(
          (house): house is Houses => house !== undefined,
        ),
        level3: starLord === undefined ? [] : ownedHouses(agent ?? starLord, allHouses),
        level4: ownedHouses(effectivePlanet, allHouses),
      }),
    ] as const;
  });

  const houseSignificators = houseEntries.map(([house, chartHouse]) => {
    const occupants = chartHouse.planets.map((planet) => planet.name);
    const owner = SIGN_LORDS[RASHIS[Math.floor(Number(chartHouse.cusp) / 30)] as Rashis];
    const level1 = occupants.flatMap((occupant) => planetsInStarOf(occupant, planets));
    const level3 = planetsInStarOf(owner, planets);
    return [
      String(house),
      HouseSignificators.make({
        house,
        level1,
        level2: occupants,
        level3,
        level4: [owner],
      }),
    ] as const;
  });

  const moon = byName.get("Moon");
  const ascendantStarLord = nakshatraOf(lagna.longitude).lord;
  const ascendantSignLord = SIGN_LORDS[lagna.sign.name];
  const moonStarLord = moon === undefined ? ascendantStarLord : starLordOf(moon);
  const moonSignLord = moon?.sign.lord ?? ascendantSignLord;

  return {
    planetSignifications: Record.fromEntries(significations) as Record<
      Planets,
      PlanetSignification
    >,
    houseSignificators: Record.fromEntries(houseSignificators) as Record<
      Houses,
      HouseSignificators
    >,
    rulingPlanets: [
      ascendantStarLord,
      ascendantSignLord,
      moonStarLord,
      moonSignLord,
      dayLord(date),
    ] as [Planets, Planets, Planets, Planets, Planets],
  };
}

/**
 * Creates a cusp-based chart from ephemeris house data and a division's
 * mapped planets.
 * It validates that the twelve normalized cusp intervals cover exactly one
 * circle, then assigns each planet to one half-open interval `[cusp, next cusp)`.
 */
export const chartFromHouseData = Effect.fn("Chart.fromHouseData")(function* (
  houses: HouseData,
  chart: Chart,
  date: DateTimeType,
) {
  const rawCusps = houses.cusps.slice(1, 13);
  const rawAngles = [
    houses.ascendant,
    houses.mc,
    houses.armc,
    houses.vertex,
    houses.equatorialAscendant,
    houses.coAscendant1,
    houses.coAscendant2,
    houses.polarAscendant,
  ];

  if (
    rawCusps.length !== HOUSE_NUMBERS.length ||
    rawCusps.some((cusp) => !Number.isFinite(cusp)) ||
    rawAngles.some((angle) => !Number.isFinite(angle))
  ) {
    return yield* ChartCalculationError.make({
      stage: "mapping",
      message: "Could not calculate chart",
      cause: houses,
    });
  }

  const lagna = chart.houses[1].lagna;
  if (lagna === null) {
    return yield* ChartCalculationError.make({
      stage: "mapping",
      message: "Could not calculate chart",
      cause: chart,
    });
  }

  const mappedCusps = yield* Effect.all(
    rawCusps.map((cusp) => getDivisionalTarget(normalizeAngle(cusp), chart.division)),
    { concurrency: "unbounded" },
  ).pipe(Effect.map((targets) => targets.map(({ longitude }) => longitude)));
  const equalCusps = HOUSE_NUMBERS.map((_, index) =>
    normalizeAngle(Math.floor(lagna.longitude / 30) * 30 + index * 30),
  );
  const mappedSpans = mappedCusps.map((cusp, index) => {
    const nextCusp = mappedCusps[(index + 1) % mappedCusps.length];
    return nextCusp === undefined ? Number.NaN : forwardDistance(cusp, nextCusp);
  });
  const mappedFullCircle = mappedSpans.reduce((total, span) => total + span, 0);
  const cusps =
    houses.houseSystem === "WholeSign" ||
    mappedSpans.some((span) => span === 0) ||
    Math.abs(mappedFullCircle - 360) > 1e-7
      ? equalCusps
      : mappedCusps;
  const spans = cusps.map((cusp, index) => {
    const nextCusp = cusps[(index + 1) % cusps.length];
    return nextCusp === undefined ? Number.NaN : forwardDistance(cusp, nextCusp);
  });
  const fullCircle = spans.reduce((total, span) => total + span, 0);
  if (spans.some((span) => span === 0) || Math.abs(fullCircle - 360) > 1e-7) {
    return yield* ChartCalculationError.make({
      stage: "mapping",
      message: "Could not calculate chart",
      cause: houses.cusps,
    });
  }

  const planets = Record.values(chart.houses).flatMap((house) => house.planets);
  const planetsByHouse = distributePlanets(planets, cusps, spans);

  const houseEntries: Array<readonly [string, House]> = [];
  for (const [index, houseNumber] of HOUSE_NUMBERS.entries()) {
    const cusp = cusps[index];
    const housePlanets = planetsByHouse[index];
    if (cusp === undefined || housePlanets === undefined) {
      return yield* ChartCalculationError.make({
        stage: "mapping",
        message: "Could not calculate chart",
        cause: houses.cusps,
      });
    }
    houseEntries.push([
      String(houseNumber),
      House.make({
        sign: RASHIS[Math.floor(cusp / 30)]!,
        cusp: Longitude.make(cusp),
        signLord: signLordOf(Longitude.make(cusp)),
        starLord: nakshatraOf(Longitude.make(cusp)).lord,
        subLord: subLordOf(Longitude.make(cusp)),
        significations: HOUSE_SIGNIFICATIONS[houseNumber],
        planets: housePlanets,
        lagna: index === 0 ? lagna : null,
      }),
    ]);
  }

  const chartHouses = yield* Schema.decodeUnknownEffect(ChartHouses)(
    Record.fromEntries(houseEntries),
  ).pipe(
    Effect.mapError((cause) =>
      ChartCalculationError.make({
        stage: "mapping",
        message: "Could not calculate chart",
        cause,
      }),
    ),
  );

  const significations = calculateSignifications(chartHouses, lagna, date);

  return Chart.make({
    ...(chart.sex === undefined ? {} : { sex: chart.sex }),
    provenance: chart.provenance,
    division: chart.division,
    houses: chartHouses,
    angles: ChartAngles.make({
      ascendant: CircleAngle.make(normalizeAngle(houses.ascendant)),
      mc: CircleAngle.make(normalizeAngle(houses.mc)),
      armc: CircleAngle.make(normalizeAngle(houses.armc)),
      vertex: CircleAngle.make(normalizeAngle(houses.vertex)),
      equatorialAscendant: CircleAngle.make(normalizeAngle(houses.equatorialAscendant)),
      coAscendant1: CircleAngle.make(normalizeAngle(houses.coAscendant1)),
      coAscendant2: CircleAngle.make(normalizeAngle(houses.coAscendant2)),
      polarAscendant: CircleAngle.make(normalizeAngle(houses.polarAscendant)),
    }),
    ...significations,
  });
});
