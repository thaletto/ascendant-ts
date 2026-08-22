import { Console, Effect } from "effect";
import type { ChartCalculation, Chart as DivisionalChart, Placements } from "../src/chart/index.ts";

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
  return Object.entries(chart.houses).flatMap(([houseNumber, houseData]) => {
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

export const printChartCalculation = Effect.fn("Examples.printChartCalculation")(function* (
  calculation: ChartCalculation,
) {
  yield* Console.log("Placements");
  yield* Console.table(placementRows(calculation.placements));

  for (const chart of calculation.charts) {
    yield* Console.log(`D${chart.division} Chart`);
    yield* Console.table(chartRows(chart));
  }
});
