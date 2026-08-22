import { Config, Console, Effect, Layer } from "effect";
import { ChartService } from "./src/chart";
import { AstroParams } from "./src/config/astro-params";
import { Ephemeris } from "./src/ephemeris/service";
import { type Chart, LocatedMoment, Moment, type Placements } from "./src/types";

type TableValue = string | number | boolean;
type TableRow = Readonly<Record<string, TableValue>>;

const displayLongitude = (longitude: number): number => Number(longitude.toFixed(6));

const placementRows = (placements: Placements): readonly TableRow[] => [
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

const chartRows = (chart: Chart): readonly TableRow[] =>
  Object.entries(chart.houses).flatMap(([houseNumber, houseData]) => {
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

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const program = config.pipe(
  Effect.flatMap(({ date, latitude, longitude }) =>
    Effect.gen(function* () {
      const chartService = yield* ChartService;
      const locatedMoment = new LocatedMoment({
        moment: new Moment({ date: new Date(date) }),
        latitude,
        longitude,
      });
      const calculation = yield* chartService.generate(locatedMoment, [1, 9]);
      yield* Console.log("Placements");
      yield* Console.table(placementRows(calculation.placements));

      for (const chart of calculation.charts) {
        yield* Console.log(`D${chart.division} Chart`);
        yield* Console.table(chartRows(chart));
      }
    }),
  ),
);

const appLayer = ChartService.layer.pipe(
  Layer.provideMerge(AstroParams.layer),
  Layer.provideMerge(Ephemeris.layer),
);

Effect.runPromise(program.pipe(Effect.provide(appLayer))).catch((error) => {
  console.error(error);
});
