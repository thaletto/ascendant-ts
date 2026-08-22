import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Chart from "../src/chart/index.js";
import * as SAV from "../src/sav/index.js";

function sourcePlanet(name: typeof Chart.Planets.Type, longitude: number): Chart.SourcePlanet {
  return new Chart.SourcePlanet({
    name,
    longitude: Chart.Longitude.make(longitude),
    is_retrograde: false,
    nakshatra: new Chart.Nakshatra({ name: "Ashwini", lord: "Ketu", pada: 1 }),
  });
}

const placements = new Chart.Placements({
  lagna: new Chart.SourceLagna({
    name: "Lagna",
    longitude: Chart.Longitude.make(100),
    nakshatra: new Chart.Nakshatra({ name: "Pushya", lord: "Saturn", pada: 2 }),
  }),
  planets: [
    sourcePlanet("Sun", 10),
    sourcePlanet("Moon", 45),
    sourcePlanet("Mars", 80),
    sourcePlanet("Mercury", 110),
    sourcePlanet("Jupiter", 200),
    sourcePlanet("Venus", 145),
    sourcePlanet("Saturn", 250),
    sourcePlanet("Rahu", 300),
    sourcePlanet("Ketu", 120),
  ],
});

describe("SAV.Service.calculate", () => {
  it.effect("calculates the complete classical Parashari result", () =>
    Effect.gen(function* () {
      const sav = yield* SAV.Service;
      const result = yield* sav.calculate(placements);

      expect(Object.values(result.sarva)).toEqual([32, 31, 25, 32, 24, 30, 29, 24, 29, 22, 26, 33]);
      expect(result.totals).toEqual({
        Sun: 48,
        Moon: 49,
        Mars: 39,
        Mercury: 54,
        Jupiter: 56,
        Venus: 52,
        Saturn: 39,
        Lagna: 49,
        sarva: 337,
      });
      expect(result.bhinna.Sun).toEqual({
        Aries: 4,
        Taurus: 3,
        Gemini: 5,
        Cancer: 5,
        Leo: 2,
        Virgo: 4,
        Libra: 4,
        Scorpio: 2,
        Sagittarius: 5,
        Capricorn: 4,
        Aquarius: 5,
        Pisces: 5,
      });
      expect(result.reduced.Sun).toEqual({
        Aries: 2,
        Taurus: 0,
        Gemini: 0,
        Cancer: 3,
        Leo: 0,
        Virgo: 0,
        Libra: 0,
        Scorpio: 0,
        Sagittarius: 0,
        Capricorn: 0,
        Aquarius: 0,
        Pisces: 0,
      });
      expect(result.shodhya_pinda.Sun).toEqual({
        rashi_pinda: 26,
        graha_pinda: 25,
        shodhya_pinda: 51,
      });
    }).pipe(Effect.provide(SAV.layer)),
  );

  it.effect("returns complete non-negative tables and internally consistent Pindas", () =>
    Effect.gen(function* () {
      const sav = yield* SAV.Service;
      const result = yield* sav.calculate(placements);

      expect(Object.keys(result.bhinna)).toHaveLength(8);
      expect(Object.keys(result.reduced)).toHaveLength(7);
      expect(Object.keys(result.shodhya_pinda)).toHaveLength(7);
      for (const scores of Object.values(result.bhinna)) {
        expect(Object.keys(scores)).toHaveLength(12);
      }
      for (const scores of Object.values(result.reduced)) {
        expect(Object.keys(scores)).toHaveLength(12);
        expect(Object.values(scores).every((score) => score >= 0)).toBe(true);
      }
      for (const pinda of Object.values(result.shodhya_pinda)) {
        expect(pinda.shodhya_pinda).toBe(pinda.rashi_pinda + pinda.graha_pinda);
      }
    }).pipe(Effect.provide(SAV.layer)),
  );

  it.effect("ignores Rahu and Ketu", () =>
    Effect.gen(function* () {
      const sav = yield* SAV.Service;
      const withNodes = yield* sav.calculate(placements);
      const withoutNodes = yield* sav.calculate(
        new Chart.Placements({
          lagna: placements.lagna,
          planets: placements.planets.filter(
            (planet) => planet.name !== "Rahu" && planet.name !== "Ketu",
          ),
        }),
      );

      expect(withNodes).toEqual(withoutNodes);
    }).pipe(Effect.provide(SAV.layer)),
  );

  it.effect("fails with a typed error for missing or duplicate classical planets", () =>
    Effect.gen(function* () {
      const sav = yield* SAV.Service;
      const missing = new Chart.Placements({
        lagna: placements.lagna,
        planets: placements.planets.filter((planet) => planet.name !== "Moon"),
      });
      const missingError = yield* sav.calculate(missing).pipe(Effect.flip);
      expect(missingError).toMatchObject({
        _tag: "SAVCalculationError",
        message: "Could not calculate Parashari Ashtakavarga",
      });

      const sun = placements.planets.find((planet) => planet.name === "Sun");
      expect(sun).toBeDefined();
      if (sun === undefined) return;
      const duplicate = new Chart.Placements({
        lagna: placements.lagna,
        planets: [...placements.planets, sun],
      });
      const duplicateError = yield* sav.calculate(duplicate).pipe(Effect.flip);
      expect(duplicateError).toMatchObject({
        _tag: "SAVCalculationError",
        message: "Could not calculate Parashari Ashtakavarga",
      });
    }).pipe(Effect.provide(SAV.layer)),
  );
});
