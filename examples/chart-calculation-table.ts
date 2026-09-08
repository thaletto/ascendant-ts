import { Console, Effect, Record as EffectRecord } from "effect";

import { nakshatraOf, subLordOf } from "../src/chart/helper.ts";
import type { ChartCalculation, Chart, Placements } from "../src/chart/index.ts";

type TableValue = string | number | boolean;
type TableRow = Readonly<Record<string, TableValue>>;

function displayLongitude(longitude: number): number {
  return Number(longitude.toFixed(6));
}

function displayOptionalLongitude(longitude: number | undefined): TableValue {
  return longitude === undefined ? "—" : displayLongitude(longitude);
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

function houseRows(chart: Chart): readonly TableRow[] {
  return EffectRecord.toEntries(chart.houses).flatMap(([houseNumber, houseData]) => {
    const house = Number(houseNumber);
    const rows: TableRow[] = [];

    if (houseData.lagna !== null) {
      const lagna = houseData.lagna;
      rows.push({
        House: house,
        Cusp: displayOptionalLongitude(houseData.cusp),
        Point: lagna.name,
        "Sign Lord": lagna.sign.lord,
        "Star Lord": nakshatraOf(lagna.longitude).lord,
        "Sub Lord": subLordOf(lagna.longitude),
        Longitude: displayLongitude(lagna.longitude),
        Degree: displayLongitude(lagna.degree),
        Sign: lagna.sign.name,
        Dignity: "—",
        Retrograde: "—",
      });
    }

    rows.push(
      ...houseData.planets.map((planet) => ({
        House: house,
        Cusp: displayOptionalLongitude(houseData.cusp),
        Point: planet.name,
        "Sign Lord": planet.sign.lord,
        "Star Lord": nakshatraOf(planet.longitude).lord,
        "Sub Lord": subLordOf(planet.longitude),
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
            Cusp: displayOptionalLongitude(houseData.cusp),
            Point: "—",
            "Sign Lord": houseData.signLord ?? "—",
            "Star Lord": houseData.starLord ?? "—",
            "Sub Lord": houseData.subLord ?? "—",
            Longitude: "—",
            Degree: "—",
            Sign: "—",
            Dignity: "—",
            Retrograde: "—",
          },
        ];
  });
}

function angleRows(chart: Chart): readonly TableRow[] {
  const angles = chart.angles;
  if (angles === undefined) return [];

  return [
    { Angle: "Ascendant", Longitude: displayLongitude(angles.ascendant) },
    { Angle: "MC", Longitude: displayLongitude(angles.mc) },
    { Angle: "ARMC", Longitude: displayLongitude(angles.armc) },
    { Angle: "Vertex", Longitude: displayLongitude(angles.vertex) },
    {
      Angle: "Equatorial Ascendant",
      Longitude: displayLongitude(angles.equatorialAscendant),
    },
    { Angle: "Co-Ascendant 1", Longitude: displayLongitude(angles.coAscendant1) },
    { Angle: "Co-Ascendant 2", Longitude: displayLongitude(angles.coAscendant2) },
    { Angle: "Polar Ascendant", Longitude: displayLongitude(angles.polarAscendant) },
  ];
}

function significationRows(chart: Chart): readonly TableRow[] {
  return EffectRecord.toEntries(chart.houses).map(([houseNumber, houseData]) => ({
    House: Number(houseNumber),
    Cusp: displayOptionalLongitude(houseData.cusp),
    "Sign Lord": houseData.signLord ?? "—",
    "Star Lord": houseData.starLord ?? "—",
    "Sub Lord": houseData.subLord ?? "—",
    Significations: houseData.significations?.join(", ") ?? "—",
  }));
}

function planetSignificationRows(chart: Chart): readonly TableRow[] {
  if (chart.planetSignifications === undefined) return [];

  return EffectRecord.toEntries(chart.planetSignifications).map(([planet, signification]) => ({
    Planet: planet,
    "Level 1": signification.level1.join(", ") || "—",
    "Level 2": signification.level2.join(", ") || "—",
    "Level 3": signification.level3.join(", ") || "—",
    "Level 4": signification.level4.join(", ") || "—",
  }));
}

function houseSignificatorRows(chart: Chart): readonly TableRow[] {
  if (chart.houseSignificators === undefined) return [];

  return EffectRecord.toEntries(chart.houseSignificators).map(([houseNumber, significators]) => ({
    House: Number(houseNumber),
    "Level 1": significators.level1.join(", ") || "—",
    "Level 2": significators.level2.join(", ") || "—",
    "Level 3": significators.level3.join(", ") || "—",
    "Level 4": significators.level4.join(", ") || "—",
  }));
}

export const printChartCalculation = Effect.fn("Examples.printChartCalculation")(function* (
  calculation: ChartCalculation,
) {
  yield* Console.log("Placements");
  yield* Console.table(placementRows(calculation.placements));

  for (const chart of calculation.charts) {
    const division = `D${chart.division}`;

    yield* Console.log("");
    yield* Console.log(`========== ${division} ==========`);
    yield* Console.log(
      `Chart ${division} (${calculation.astroParams.houseSystem}, ${calculation.astroParams.ayanamsa})`,
    );
    yield* Console.table(houseRows(chart));

    yield* Console.log("Chart Angles");
    yield* Console.table(angleRows(chart));

    yield* Console.log("House Significations");
    yield* Console.table(significationRows(chart));

    yield* Console.log("Planet Significations");
    yield* Console.table(planetSignificationRows(chart));

    yield* Console.log("House Significators");
    yield* Console.table(houseSignificatorRows(chart));

    yield* Console.log("Ruling Planets");
    yield* Console.table(
      (chart.rulingPlanets ?? []).map((planet, index) => ({
        Rank: index + 1,
        Planet: planet,
      })),
    );
  }
});
