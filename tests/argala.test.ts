import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Argala from "../src/jaimini/argala.js";
import * as Chart from "../src/chart/index.js";

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
    sourcePlanet("Mars", 70),
    sourcePlanet("Mercury", 100),
    sourcePlanet("Jupiter", 130),
    sourcePlanet("Venus", 160),
    sourcePlanet("Saturn", 190),
    sourcePlanet("Rahu", 220),
    sourcePlanet("Ketu", 250),
  ],
});

describe("Argala.Service.calculate", () => {
  it.effect("returns structural supporting and obstructing relations for a Sign", () =>
    Effect.gen(function* () {
      const argala = yield* Argala.Service;
      const result = yield* argala.calculate(placements, { kind: "Sign", sign: "Pisces" });

      expect(result).toEqual({
        provenance: {
          school: "Jaimini",
          method: "structural-positions",
          version: 1,
        },
        reference: { kind: "Sign", sign: "Pisces" },
        referenceSign: "Pisces",
        direction: "forward",
        supporting: [
          { position: 2, sign: "Aries", planets: ["Sun"] },
          { position: 4, sign: "Gemini", planets: ["Mars"] },
          { position: 11, sign: "Capricorn", planets: [] },
        ],
        obstructing: [
          { position: 12, sign: "Aquarius", planets: [] },
          { position: 10, sign: "Sagittarius", planets: ["Ketu"] },
          { position: 3, sign: "Taurus", planets: ["Moon"] },
        ],
        secondarySupporting: { position: 5, sign: "Cancer", planets: ["Mercury"] },
        secondaryObstructing: { position: 9, sign: "Scorpio", planets: ["Rahu"] },
      });
    }).pipe(Effect.provide(Argala.layer)),
  );

  it.effect("counts the same positions in reverse for an explicit Ketu reference", () =>
    Effect.gen(function* () {
      const argala = yield* Argala.Service;
      const result = yield* argala.calculate(placements, { kind: "Ketu" });

      expect(result.referenceSign).toBe("Sagittarius");
      expect(result.direction).toBe("reverse");
      expect(result.supporting).toEqual([
        { position: 2, sign: "Scorpio", planets: ["Rahu"] },
        { position: 4, sign: "Virgo", planets: ["Venus"] },
        { position: 11, sign: "Aquarius", planets: [] },
      ]);
      expect(result.obstructing).toEqual([
        { position: 12, sign: "Capricorn", planets: [] },
        { position: 10, sign: "Pisces", planets: [] },
        { position: 3, sign: "Libra", planets: ["Saturn"] },
      ]);
      expect(result.secondarySupporting).toEqual({
        position: 5,
        sign: "Leo",
        planets: ["Jupiter"],
      });
      expect(result.secondaryObstructing).toEqual({
        position: 9,
        sign: "Aries",
        planets: ["Sun"],
      });
    }).pipe(Effect.provide(Argala.layer)),
  );

  it.effect("fails when a graha needed to distinguish empty positions is missing", () =>
    Effect.gen(function* () {
      const argala = yield* Argala.Service;
      const missing = new Chart.Placements({
        lagna: placements.lagna,
        planets: placements.planets.filter((planet) => planet.name !== "Ketu"),
      });
      const error = yield* argala
        .calculate(missing, { kind: "Sign", sign: "Pisces" })
        .pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "ArgalaEvidenceError",
        placement: "Ketu",
        expected: 1,
        actual: 0,
      });
    }).pipe(Effect.provide(Argala.layer)),
  );
});
