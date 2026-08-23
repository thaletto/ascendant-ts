import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as Chart from "../src/chart/index.js";
import * as Upapada from "../src/jaimini/upapada.js";

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
  planets: [sourcePlanet("Jupiter", 10)],
});

describe("Upapada.Service.calculate", () => {
  it.effect("returns the plain Arudha projection of the twelfth house", () =>
    Effect.gen(function* () {
      const upapada = yield* Upapada.Service;
      const result = yield* upapada.calculate(placements);

      expect(result).toEqual({
        provenance: {
          school: "Jaimini",
          method: "twelfth-house-plain-projection",
          version: 1,
        },
        house: 12,
        sourceSign: "Pisces",
        lord: "Jupiter",
        lordSign: "Aries",
        sign: "Taurus",
      });
    }).pipe(Effect.provide(Upapada.layer)),
  );

  it.effect("reports missing twelfth-house lord evidence as an Upapada error", () =>
    Effect.gen(function* () {
      const upapada = yield* Upapada.Service;
      const missing = new Chart.Placements({ lagna: placements.lagna, planets: [] });
      const error = yield* upapada.calculate(missing).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "UpapadaEvidenceError",
        placement: "Jupiter",
        expected: 1,
        actual: 0,
      });
    }).pipe(Effect.provide(Upapada.layer)),
  );
});
