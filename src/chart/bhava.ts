import { Effect, Schema } from "effect";
import type { HouseData } from "../ephemeris/model.js";
import { ChartCalculationError } from "./error.js";
import {
  BhavaAngles,
  BhavaChart,
  BhavaHouse,
  BhavaHouses,
  CircleAngle,
  type Chart,
  Longitude,
  type Planet,
} from "./model.js";

const HOUSE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

function forwardDistance(from: number, to: number): number {
  return normalizeAngle(to - from);
}

export const bhavaFromHouseData = Effect.fn("Chart.Bhava.fromHouseData")(function* (
  houses: HouseData,
  d1: Chart,
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
    return yield* new ChartCalculationError({
      stage: "mapping",
      message: "Could not calculate Bhava chart",
      cause: houses,
    });
  }

  const cusps = rawCusps.map((cusp) => normalizeAngle(cusp));
  const spans = cusps.map((cusp, index) => {
    const nextCusp = cusps[(index + 1) % cusps.length];
    return nextCusp === undefined ? Number.NaN : forwardDistance(cusp, nextCusp);
  });
  const fullCircle = spans.reduce((total, span) => total + span, 0);
  if (spans.some((span) => span === 0) || Math.abs(fullCircle - 360) > 1e-7) {
    return yield* new ChartCalculationError({
      stage: "mapping",
      message: "Could not calculate Bhava chart",
      cause: houses.cusps,
    });
  }

  const planets = Object.values(d1.houses).flatMap((house) => house.planets);
  const lagna = d1.houses[1].lagna;
  if (lagna === null) {
    return yield* new ChartCalculationError({
      stage: "mapping",
      message: "Could not calculate Bhava chart",
      cause: d1,
    });
  }

  const houseFor = (longitude: number): number =>
    cusps.findIndex((cusp, index) => {
      const span = spans[index];
      return span !== undefined && forwardDistance(cusp, longitude) < span;
    });

  const planetsByHouse: Array<Array<Planet>> = Array.from(
    { length: HOUSE_NUMBERS.length },
    () => [],
  );
  for (const planet of planets) {
    const houseIndex = houseFor(planet.longitude);
    const housePlanets = planetsByHouse[houseIndex];
    if (housePlanets === undefined) {
      return yield* new ChartCalculationError({
        stage: "mapping",
        message: "Could not calculate Bhava chart",
        cause: houses.cusps,
      });
    }
    housePlanets.push(planet);
  }

  const bhavaHouseEntries: Array<readonly [number, BhavaHouse]> = [];
  for (const [index, houseNumber] of HOUSE_NUMBERS.entries()) {
    const cusp = cusps[index];
    const housePlanets = planetsByHouse[index];
    if (cusp === undefined || housePlanets === undefined) {
      return yield* new ChartCalculationError({
        stage: "mapping",
        message: "Could not calculate Bhava chart",
        cause: houses.cusps,
      });
    }
    bhavaHouseEntries.push([
      houseNumber,
      new BhavaHouse({
        cusp: Longitude.make(cusp),
        planets: housePlanets,
        lagna: index === 0 ? lagna : null,
      }),
    ]);
  }

  const bhavaHouses = yield* Schema.decodeUnknownEffect(BhavaHouses)(
    Object.fromEntries(bhavaHouseEntries),
  ).pipe(
    Effect.mapError(
      (cause) =>
        new ChartCalculationError({
          stage: "mapping",
          message: "Could not calculate Bhava chart",
          cause,
        }),
    ),
  );

  return new BhavaChart({
    houses: bhavaHouses,
    angles: new BhavaAngles({
      ascendant: CircleAngle.make(normalizeAngle(houses.ascendant)),
      mc: CircleAngle.make(normalizeAngle(houses.mc)),
      armc: CircleAngle.make(normalizeAngle(houses.armc)),
      vertex: CircleAngle.make(normalizeAngle(houses.vertex)),
      equatorialAscendant: CircleAngle.make(normalizeAngle(houses.equatorialAscendant)),
      coAscendant1: CircleAngle.make(normalizeAngle(houses.coAscendant1)),
      coAscendant2: CircleAngle.make(normalizeAngle(houses.coAscendant2)),
      polarAscendant: CircleAngle.make(normalizeAngle(houses.polarAscendant)),
    }),
  });
});
