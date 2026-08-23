import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Chart from "../src/chart/index.js";
import * as Karakamsha from "../src/jaimini/karakamsha.js";

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
    longitude: Chart.Longitude.make(0),
    nakshatra: new Chart.Nakshatra({ name: "Ashwini", lord: "Ketu", pada: 1 }),
  }),
  planets: [
    sourcePlanet("Sun", 10),
    sourcePlanet("Moon", 40),
    sourcePlanet("Mars", 8),
    sourcePlanet("Mercury", 7),
    sourcePlanet("Jupiter", 6),
    sourcePlanet("Venus", 5),
    sourcePlanet("Saturn", 4),
  ],
});

describe("Karakamsha.Service.calculate", () => {
  it.effect("returns the D9 Sign of every planet holding Atmakaraka", () =>
    Effect.gen(function* () {
      const karakamsha = yield* Karakamsha.Service;
      const result = yield* karakamsha.calculate(placements);

      expect(result).toEqual({
        provenance: {
          school: "Jaimini",
          method: "atmakaraka-d9-sign",
          version: 1,
        },
        placements: [
          { planet: "Sun", sign: "Cancer" },
          { planet: "Moon", sign: "Aries" },
        ],
      });
    }).pipe(Effect.provide(Karakamsha.layer)),
  );

  it.effect("maps missing Chara Karaka evidence to a Karakamsha error", () =>
    Effect.gen(function* () {
      const karakamsha = yield* Karakamsha.Service;
      const missing = new Chart.Placements({
        lagna: placements.lagna,
        planets: placements.planets.filter((planet) => planet.name !== "Saturn"),
      });
      const error = yield* karakamsha.calculate(missing).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "KarakamshaEvidenceError",
        placement: "Saturn",
        expected: 1,
        actual: 0,
      });
    }).pipe(Effect.provide(Karakamsha.layer)),
  );
});
