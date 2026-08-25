import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";

import * as Chart from "../src/chart/index.js";
import * as CharaKarakas from "../src/jaimini/chara-karakas.js";

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

describe("CharaKarakas.Service.calculate", () => {
  it.effect("gives every exactly tied planet every role occupied by its ranks", () =>
    Effect.gen(function* () {
      const charaKarakas = yield* CharaKarakas.Service;
      const result = yield* charaKarakas.calculate(placements);

      expect(result.provenance).toEqual({
        school: "Jaimini",
        method: "exact-degree-shared-roles",
        version: 1,
      });
      expect(result.assignments).toEqual({
        Atmakaraka: [
          { planet: "Sun", degree: 10 },
          { planet: "Moon", degree: 10 },
        ],
        Amatyakaraka: [
          { planet: "Sun", degree: 10 },
          { planet: "Moon", degree: 10 },
        ],
        Bhratrikaraka: [{ planet: "Mars", degree: 8 }],
        Matrikaraka: [{ planet: "Mercury", degree: 7 }],
        Putrakaraka: [{ planet: "Jupiter", degree: 6 }],
        Gnatikaraka: [{ planet: "Venus", degree: 5 }],
        Darakaraka: [{ planet: "Saturn", degree: 4 }],
      });
    }).pipe(Effect.provide(CharaKarakas.layer)),
  );

  it.effect("does not round distinct Degrees into a tie", () =>
    Effect.gen(function* () {
      const charaKarakas = yield* CharaKarakas.Service;
      const distinct = new Chart.Placements({
        lagna: placements.lagna,
        planets: placements.planets.map((planet) =>
          planet.name === "Moon" ? sourcePlanet("Moon", 40.0000001) : planet,
        ),
      });
      const result = yield* charaKarakas.calculate(distinct);

      expect(result.assignments.Atmakaraka.map((holder) => holder.planet)).toEqual(["Moon"]);
      expect(result.assignments.Atmakaraka[0]?.degree).toBeGreaterThan(10);
      expect(result.assignments.Amatyakaraka).toEqual([{ planet: "Sun", degree: 10 }]);
    }).pipe(Effect.provide(CharaKarakas.layer)),
  );

  it.effect("recognizes an exact decimal Degree shared across different Signs", () =>
    Effect.gen(function* () {
      const charaKarakas = yield* CharaKarakas.Service;
      const decimalTie = new Chart.Placements({
        lagna: placements.lagna,
        planets: placements.planets.map((planet) => {
          if (planet.name === "Sun") return sourcePlanet("Sun", 10.2);
          if (planet.name === "Moon") return sourcePlanet("Moon", 40.2);
          return planet;
        }),
      });
      const result = yield* charaKarakas.calculate(decimalTie);

      expect(result.assignments.Atmakaraka).toEqual([
        { planet: "Sun", degree: 10.2 },
        { planet: "Moon", degree: 10.2 },
      ]);
      expect(result.assignments.Amatyakaraka).toEqual(result.assignments.Atmakaraka);
    }).pipe(Effect.provide(CharaKarakas.layer)),
  );

  it.effect("fails with named evidence when a classical planet is missing", () =>
    Effect.gen(function* () {
      const charaKarakas = yield* CharaKarakas.Service;
      const missing = new Chart.Placements({
        lagna: placements.lagna,
        planets: placements.planets.filter((planet) => planet.name !== "Saturn"),
      });
      const error = yield* charaKarakas.calculate(missing).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "CharaKarakasEvidenceError",
        placement: "Saturn",
        expected: 1,
        actual: 0,
      });
    }).pipe(Effect.provide(CharaKarakas.layer)),
  );
});
