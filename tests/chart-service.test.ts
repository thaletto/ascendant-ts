import { describe, expect, it } from "@effect/vitest";
import { Effect, Layer, Schema } from "effect";
import * as AstroParams from "../src/astro-params/index.js";
import * as Chart from "../src/chart/index.js";
import * as Ephemeris from "../src/ephemeris/index.js";

interface EphemerisTestOptions {
  readonly sunLongitude?: number;
  readonly failHouses?: boolean;
  readonly ascendant?: number;
  readonly invalidBody?: Ephemeris.CelestialBody;
  readonly onAyanamsa?: (ayanamsa: "Lahiri" | "Raman") => void;
  readonly onHouseSystem?: (houseSystem: "Placidus" | "WholeSign") => void;
}

const ephemerisTestLayer = (options: EphemerisTestOptions = {}) => {
  const {
    sunLongitude = 10,
    failHouses = false,
    ascendant = 100,
    invalidBody,
    onAyanamsa,
    onHouseSystem,
  } = options;
  const longitudes = new Map<Ephemeris.CelestialBody, number>([
    ["Sun", sunLongitude],
    ["Moon", 45],
    ["Mars", 80],
    ["Mercury", 110],
    ["Venus", 145],
    ["Jupiter", 200],
    ["Saturn", 250],
    ["TrueNode", 300],
  ]);

  return Layer.succeed(Ephemeris.Service, {
    dateToJulianDay: () => Effect.succeed(Ephemeris.JulianDay.make(2_451_545)),
    calculatePosition: (_julianDay, body, ayanamsa) => {
      onAyanamsa?.(ayanamsa);
      return Effect.succeed({
        longitude: body === invalidBody ? Number.NaN : longitudes.get(body)!,
        latitude: 0,
        distance: 1,
        longitudeSpeed: body === "Saturn" ? -0.1 : 0.1,
        latitudeSpeed: 0,
        distanceSpeed: 0,
        flags: 0,
      });
    },
    calculateHouses: (_julianDay, _latitude, _longitude, houseSystem, ayanamsa) => {
      onAyanamsa?.(ayanamsa);
      onHouseSystem?.(houseSystem);
      if (failHouses) {
        return Effect.fail(
          new Ephemeris.EphemerisError({ operation: "calculateHouses", cause: "test failure" }),
        );
      }
      return Effect.succeed({
        cusps: Array.from({ length: 13 }, (_, index) =>
          index === 0 ? 0 : (90 + index * 30) % 360,
        ),
        ascendant,
        mc: 0,
        armc: 0,
        vertex: 0,
        equatorialAscendant: 0,
        coAscendant1: 0,
        coAscendant2: 0,
        polarAscendant: 0,
        houseSystem,
      });
    },
  });
};

const astroParamsTestLayer = (
  ayanamsa: "Lahiri" | "Raman" = "Lahiri",
  houseSystem: "Placidus" | "WholeSign" = "Placidus",
) => AstroParams.layer({ ayanamsa, houseSystem });

const chartServiceTestLayer = Chart.layer.pipe(
  Layer.provideMerge(ephemerisTestLayer()),
  Layer.provideMerge(astroParamsTestLayer()),
);

const lateLeoSunTestLayer = Chart.layer.pipe(
  Layer.provideMerge(ephemerisTestLayer({ sunLongitude: 19 })),
  Layer.provideMerge(astroParamsTestLayer()),
);

const failingEphemerisTestLayer = Chart.layer.pipe(
  Layer.provideMerge(ephemerisTestLayer({ failHouses: true })),
  Layer.provideMerge(astroParamsTestLayer()),
);

const invalidPlacementTestLayer = Chart.layer.pipe(
  Layer.provideMerge(ephemerisTestLayer({ invalidBody: "Sun" })),
  Layer.provideMerge(astroParamsTestLayer()),
);

const invalidLagnaTestLayer = Chart.layer.pipe(
  Layer.provideMerge(ephemerisTestLayer({ ascendant: Number.NaN })),
  Layer.provideMerge(astroParamsTestLayer()),
);

const input = new Chart.LocatedMoment({
  moment: new Chart.Moment({ date: new Date("2000-01-01T12:00:00.000Z") }),
  latitude: 12.9716,
  longitude: 77.5946,
});

describe("Chart.Service.generate", () => {
  it.effect("returns D1 as an identity mapping from shared Placements", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const calculation = yield* charts.generate(input, []);

      expect(calculation.charts).toHaveLength(1);
      const d1 = calculation.charts[0]!;
      expect(d1.division).toBe(1);
      expect(d1.houses[1].sign).toBe("Cancer");
      expect(d1.houses[1].lagna).toMatchObject({ longitude: 100, degree: 10 });

      const sun = d1.houses[10].planets.find((planet) => planet.name === "Sun");
      expect(sun).toMatchObject({ longitude: 10, degree: 10, sign: { name: "Aries" } });
      expect(
        calculation.placements.planets.find((planet) => planet.name === "Sun")?.nakshatra,
      ).toMatchObject({
        name: "Ashwini",
        pada: 4,
      });
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );

  it.effect("returns requested Divisions once in deterministic order", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const calculation = yield* charts.generate(input, [10, 9, 10]);

      expect(calculation.charts.map((chart) => chart.division)).toEqual([1, 9, 10]);

      const d9 = calculation.charts[1]!;
      expect(d9.houses[1]).toMatchObject({
        sign: "Libra",
        lagna: { longitude: 180, degree: 0 },
      });

      const d10 = calculation.charts[2]!;
      expect(d10.houses[1].sign).toBe("Gemini");
      expect(d10.houses[1].lagna?.longitude).toBeCloseTo(70, 10);
      expect(d10.houses[1].lagna?.degree).toBeCloseTo(10, 10);
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );

  it.effect("recomputes dignity from the mapped sign and Degree", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const calculation = yield* charts.generate(input, [3]);
      const d3 = calculation.charts[1]!;
      const sun = Object.values(d3.houses)
        .flatMap((house) => house.planets)
        .find((planet) => planet.name === "Sun")!;

      expect(sun).toMatchObject({
        sign: { name: "Leo" },
        in_sign: ["Own"],
      });
      expect(sun.degree).toBeCloseTo(27, 10);
    }).pipe(Effect.provide(lateLeoSunTestLayer)),
  );

  it.effect("returns a complete Chart for every supported Division", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const calculation = yield* charts.generate(input, Chart.Division.literals);

      expect(calculation.charts.map((chart) => chart.division)).toEqual(Chart.Division.literals);

      for (const chart of calculation.charts) {
        expect(Object.keys(chart.houses)).toHaveLength(12);
        expect(chart.houses[1].lagna).not.toBeNull();
        const planets = Object.values(chart.houses).flatMap((house) => house.planets);
        expect(planets.map((planet) => planet.name).sort()).toEqual([
          "Jupiter",
          "Ketu",
          "Mars",
          "Mercury",
          "Moon",
          "Rahu",
          "Saturn",
          "Sun",
          "Venus",
        ]);
        for (const planet of planets) {
          expect(planet.longitude).toBeGreaterThanOrEqual(0);
          expect(planet.longitude).toBeLessThan(360);
          expect(planet.degree).toBeGreaterThanOrEqual(0);
          expect(planet.degree).toBeLessThan(30);
          expect(planet.longitude % 30).toBeCloseTo(planet.degree, 10);
        }
      }
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );

  it.effect("rejects unsupported Divisions before returning any Charts", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const error = yield* charts.generate(input, [9, 8]).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "ChartCalculationError",
        stage: "validation",
        message: "Division D8 is not supported",
      });
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );

  it.effect("accepts an arbitrary Moment and geographic location", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const transitInput = new Chart.LocatedMoment({
        moment: new Chart.Moment({ date: new Date("2026-08-21T00:00:00.000Z") }),
        latitude: 0,
        longitude: 0,
      });
      const calculation = yield* charts.generate(transitInput, [9]);

      expect(calculation.charts.map((chart) => chart.division)).toEqual([1, 9]);
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );

  it.effect("derives Ketu opposite Rahu in shared Placements", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const calculation = yield* charts.generate(input);
      const rahu = calculation.placements.planets.find((planet) => planet.name === "Rahu")!;
      const ketu = calculation.placements.planets.find((planet) => planet.name === "Ketu")!;

      expect((ketu.longitude - rahu.longitude + 360) % 360).toBe(180);
      expect(ketu.is_retrograde).toBe(rahu.is_retrograde);
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );

  it.effect("fails atomically when Placements cannot be calculated", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const error = yield* charts.generate(input, [9, 10]).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "ChartCalculationError",
        stage: "placements",
        message: "Could not calculate Placements",
      });
    }).pipe(Effect.provide(failingEphemerisTestLayer)),
  );

  it.effect("rejects invalid calculation inputs before calculating Placements", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const invalidInputs = [
        new Chart.LocatedMoment({ moment: input.moment, latitude: 91, longitude: input.longitude }),
        new Chart.LocatedMoment({ moment: input.moment, latitude: input.latitude, longitude: 181 }),
        {
          moment: { date: new Date(Number.NaN) },
          latitude: input.latitude,
          longitude: input.longitude,
        } as Chart.LocatedMoment,
      ];

      for (const invalidInput of invalidInputs) {
        const error = yield* charts.generate(invalidInput, [9]).pipe(Effect.flip);
        expect(error).toMatchObject({
          _tag: "ChartCalculationError",
          stage: "validation",
        });
      }
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );

  it.effect("converts an invalid Lagna into a structured atomic failure", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const error = yield* charts.generate(input, [9]).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "ChartCalculationError",
        stage: "placements",
        message: "Could not calculate Placements",
      });
    }).pipe(Effect.provide(invalidLagnaTestLayer)),
  );

  it.effect("converts invalid ephemeris placements into a structured atomic failure", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const error = yield* charts.generate(input, [9]).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "ChartCalculationError",
        stage: "placements",
        message: "Could not calculate Placements",
      });
    }).pipe(Effect.provide(invalidPlacementTestLayer)),
  );

  it.effect("uses configured ayanamsa but always builds sign-based Charts", () => {
    const observedAyanamsas: Array<"Lahiri" | "Raman"> = [];
    const observedHouseSystems: Array<"Placidus" | "WholeSign"> = [];
    const run = Effect.gen(function* () {
      const charts = yield* Chart.Service;
      return yield* charts.generate(input, [9]);
    });
    const layer = (ayanamsa: "Lahiri" | "Raman", houseSystem: "Placidus" | "WholeSign") =>
      Chart.layer.pipe(
        Layer.provideMerge(
          ephemerisTestLayer({
            onAyanamsa: (observed) => observedAyanamsas.push(observed),
            onHouseSystem: (observed) => observedHouseSystems.push(observed),
          }),
        ),
        Layer.provideMerge(astroParamsTestLayer(ayanamsa, houseSystem)),
      );

    return Effect.gen(function* () {
      const lahiri = yield* run.pipe(Effect.provide(layer("Lahiri", "Placidus")));
      const raman = yield* run.pipe(Effect.provide(layer("Raman", "WholeSign")));

      expect(new Set(observedAyanamsas)).toEqual(new Set(["Lahiri", "Raman"]));
      expect(observedHouseSystems).toEqual(["WholeSign", "WholeSign"]);
      expect(lahiri.charts).toEqual(raman.charts);
    });
  });

  it.effect("rejects a decoded Chart calculation that does not begin with D1", () =>
    Effect.gen(function* () {
      const charts = yield* Chart.Service;
      const calculation = yield* charts.generate(input, [9]);

      expect(() =>
        Schema.decodeUnknownSync(Chart.ChartCalculation)({
          placements: calculation.placements,
          charts: [calculation.charts[1]],
        }),
      ).toThrow();
    }).pipe(Effect.provide(chartServiceTestLayer)),
  );
});
