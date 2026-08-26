import { Console, Effect, Record as EffectRecord } from "effect";

import type {
  BhavaChart,
  ChartCalculation,
  Chart as DivisionalChart,
  Placements,
} from "../src/internal/model.ts";

type TableValue = string | number | boolean;
type TableRow = Readonly<Record<string, TableValue>>;

function displayLongitude(longitude: number): number {
  return Number(longitude.toFixed(6));
}

function placementRows(placements: Placements): readonly TableRow[] {
  return [
    {
      Point: placements.lagna.name,
      Longitude: displayLongitude(placements.lagna.longitude),
      Nakshatra: placements.lagna.nakshatra.name,
      Pada: placements.lagna.nakshatra.pada,
      Retrograde: "—",
    },
    ...placements.planets.map((planet) => ({
      Point: planet.name,
      Longitude: displayLongitude(planet.longitude),
      Nakshatra: planet.nakshatra.name,
      Pada: planet.nakshatra.pada,
      Retrograde: planet.is_retrograde,
    })),
  ];
}

function chartRows(chart: DivisionalChart): readonly TableRow[] {
  return EffectRecord.toEntries(chart.houses).flatMap(([houseNumber, houseData]) => {
    const house = Number(houseNumber);
    const rows: TableRow[] = [];

    if (houseData.lagna !== null) {
      rows.push({
        House: house,
        Sign: houseData.lagna.sign.name,
        Point: houseData.lagna.name,
        Longitude: displayLongitude(houseData.lagna.longitude),
        Degree: displayLongitude(houseData.lagna.degree),
        Dignity: "—",
        Retrograde: "—",
      });
    }

    rows.push(
      ...houseData.planets.map((planet) => ({
        House: house,
        Sign: planet.sign.name,
        Point: planet.name,
        Longitude: displayLongitude(planet.longitude),
        Degree: displayLongitude(planet.degree),
        Dignity: planet.in_sign.join(", ") || "—",
        Retrograde: planet.is_retrograde,
      })),
    );

    return rows.length > 0
      ? rows
      : [
          {
            House: house,
            Sign: houseData.sign,
            Point: "—",
            Longitude: "—",
            Degree: "—",
            Dignity: "—",
            Retrograde: "—",
          },
        ];
  });
}

function bhavaRows(bhava: BhavaChart): readonly TableRow[] {
  return EffectRecord.toEntries(bhava.houses).flatMap(([houseNumber, houseData]) => {
    const house = Number(houseNumber);
    const rows: TableRow[] = [];

    if (houseData.lagna !== null) {
      rows.push({
        House: house,
        Cusp: displayLongitude(houseData.cusp),
        Point: houseData.lagna.name,
        Longitude: displayLongitude(houseData.lagna.longitude),
        Degree: displayLongitude(houseData.lagna.degree),
        Sign: houseData.lagna.sign.name,
        Dignity: "—",
        Retrograde: "—",
      });
    }

    rows.push(
      ...houseData.planets.map((planet) => ({
        House: house,
        Cusp: displayLongitude(houseData.cusp),
        Point: planet.name,
        Longitude: displayLongitude(planet.longitude),
        Degree: displayLongitude(planet.degree),
        Sign: planet.sign.name,
        Dignity: planet.in_sign.join(", ") || "—",
        Retrograde: planet.is_retrograde,
      })),
    );

    return rows.length > 0
      ? rows
      : [
          {
            House: house,
            Cusp: displayLongitude(houseData.cusp),
            Point: "—",
            Longitude: "—",
            Degree: "—",
            Sign: "—",
            Dignity: "—",
            Retrograde: "—",
          },
        ];
  });
}

function bhavaAngleRows(bhava: BhavaChart): readonly TableRow[] {
  return [
    { Angle: "Ascendant", Longitude: displayLongitude(bhava.angles.ascendant) },
    { Angle: "MC", Longitude: displayLongitude(bhava.angles.mc) },
    { Angle: "ARMC", Longitude: displayLongitude(bhava.angles.armc) },
    { Angle: "Vertex", Longitude: displayLongitude(bhava.angles.vertex) },
    {
      Angle: "Equatorial Ascendant",
      Longitude: displayLongitude(bhava.angles.equatorialAscendant),
    },
    { Angle: "Co-Ascendant 1", Longitude: displayLongitude(bhava.angles.coAscendant1) },
    { Angle: "Co-Ascendant 2", Longitude: displayLongitude(bhava.angles.coAscendant2) },
    { Angle: "Polar Ascendant", Longitude: displayLongitude(bhava.angles.polarAscendant) },
  ];
}

export const printChartCalculation = Effect.fn("Examples.printChartCalculation")(function* (
  calculation: ChartCalculation,
) {
  yield* Console.log("Placements");
  yield* Console.table(placementRows(calculation.placements));

  for (const chart of calculation.charts) {
    yield* Console.log(`D${chart.division} Chart`);
    yield* Console.table(chartRows(chart));
  }

  yield* Console.log(
    `Bhava Chart (${calculation.astroParams.houseSystem}, ${calculation.astroParams.ayanamsa})`,
  );
  yield* Console.table(bhavaRows(calculation.bhava));

  yield* Console.log("Bhava Angles");
  yield* Console.table(bhavaAngleRows(calculation.bhava));
});
