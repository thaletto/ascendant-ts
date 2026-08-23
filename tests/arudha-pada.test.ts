import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as ArudhaPada from "../src/jaimini/arudha-pada.js";
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
  planets: [sourcePlanet("Mars", 35)],
});

describe("ArudhaPada.Service.calculate", () => {
  it.effect("repeats the distance from the house Sign to its lord", () =>
    Effect.gen(function* () {
      const arudhaPada = yield* ArudhaPada.Service;
      const result = yield* arudhaPada.calculate(placements, 1);

      expect(result).toEqual({
        provenance: {
          school: "Jaimini",
          method: "plain-projection",
          version: 1,
        },
        house: 1,
        sourceSign: "Aries",
        lord: "Mars",
        lordSign: "Taurus",
        sign: "Gemini",
      });
    }).pipe(Effect.provide(ArudhaPada.layer)),
  );

  it.effect("does not substitute exceptional projections for source or seventh lord Signs", () =>
    Effect.gen(function* () {
      const arudhaPada = yield* ArudhaPada.Service;
      const sameSign = yield* arudhaPada.calculate(
        new Chart.Placements({
          lagna: placements.lagna,
          planets: [sourcePlanet("Mars", 10)],
        }),
        1,
      );
      const seventhSign = yield* arudhaPada.calculate(
        new Chart.Placements({
          lagna: placements.lagna,
          planets: [sourcePlanet("Mars", 190)],
        }),
        1,
      );

      expect(sameSign.sign).toBe("Aries");
      expect(seventhSign.sign).toBe("Aries");
    }).pipe(Effect.provide(ArudhaPada.layer)),
  );

  it.effect("fails with named evidence when the required lord is duplicated", () =>
    Effect.gen(function* () {
      const arudhaPada = yield* ArudhaPada.Service;
      const duplicate = new Chart.Placements({
        lagna: placements.lagna,
        planets: [sourcePlanet("Mars", 35), sourcePlanet("Mars", 65)],
      });
      const error = yield* arudhaPada.calculate(duplicate, 1).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "ArudhaPadaEvidenceError",
        placement: "Mars",
        expected: 1,
        actual: 2,
      });
    }).pipe(Effect.provide(ArudhaPada.layer)),
  );
});
