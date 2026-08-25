import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { TestClock } from "effect/testing";

import * as Chart from "../src/chart/index.js";
import * as Dasha from "../src/dasha/index.js";

const moment = new Chart.Moment({ date: new Date("2000-01-01T12:00:00.000Z") });
const placements = new Chart.Placements({
  lagna: new Chart.SourceLagna({
    name: "Lagna",
    longitude: Chart.Longitude.make(100),
    nakshatra: new Chart.Nakshatra({ name: "Pushya", lord: "Saturn", pada: 2 }),
  }),
  planets: [
    new Chart.SourcePlanet({
      name: "Moon",
      longitude: Chart.Longitude.make(45),
      is_retrograde: false,
      nakshatra: new Chart.Nakshatra({ name: "Rohini", lord: "Moon", pada: 2 }),
    }),
  ],
});

describe("Dasha.calculate", () => {
  it.effect("derives the nine Vimshottari Mahadashas from the natal Moon", () =>
    Effect.gen(function* () {
      const dasha = yield* Dasha.Service;
      const timeline = yield* dasha.calculate(moment, placements);

      expect(timeline.map((period) => period.mahadasha)).toEqual([
        "Moon",
        "Mars",
        "Rahu",
        "Jupiter",
        "Saturn",
        "Mercury",
        "Ketu",
        "Venus",
        "Sun",
      ]);
      expect(timeline[0]).toMatchObject({
        mahadasha: "Moon",
        start: "01-04-1996",
        end: "01-04-2006",
      });
      expect(timeline.at(-1)).toMatchObject({ end: "01-04-2116" });
    }).pipe(Effect.provide(Dasha.layer)),
  );

  it.effect("creates nine ordered Antardashas inside each Mahadasha", () =>
    Effect.gen(function* () {
      const dasha = yield* Dasha.Service;
      const timeline = yield* dasha.calculate(moment, placements);

      for (const mahadasha of timeline) {
        expect(mahadasha.antardashas).toHaveLength(9);
        expect(new Set(mahadasha.antardashas.map((period) => period.antardasha))).toEqual(
          new Set(Chart.Planets.literals),
        );
        expect(mahadasha.antardashas[0]?.start).toBe(mahadasha.start);
        expect(mahadasha.antardashas.at(-1)?.end).toBe(mahadasha.end);
      }
      expect(timeline[0]?.antardashas[0]).toMatchObject({
        mahadasha: "Moon",
        antardasha: "Moon",
        start: "01-04-1996",
        end: "01-02-1997",
      });
    }).pipe(Effect.provide(Dasha.layer)),
  );

  it.effect("fails with a typed error when the Moon is absent", () =>
    Effect.gen(function* () {
      const dasha = yield* Dasha.Service;
      const withoutMoon = new Chart.Placements({ lagna: placements.lagna, planets: [] });
      const error = yield* dasha.calculate(moment, withoutMoon).pipe(Effect.flip);

      expect(error).toMatchObject({
        _tag: "DashaCalculationError",
        message: "Could not calculate Vimshottari Dasha",
      });
    }).pipe(Effect.provide(Dasha.layer)),
  );
});

describe("DashaTimeline", () => {
  it.effect("selects inclusive current and relative periods", () =>
    Effect.gen(function* () {
      const dasha = yield* Dasha.Service;
      const periods = yield* dasha.calculate(moment, placements);

      expect((yield* dasha.current(periods, "01-04-1996")).mahadasha).toBe(periods[0]);
      expect((yield* dasha.current(periods, "01-04-1996")).antardasha).toBe(
        periods[0]?.antardashas[0],
      );
      expect(yield* dasha.mahadasha(periods, 1, "01-04-1996")).toBe(periods[1]);
      expect(yield* dasha.antardasha(periods, 1, "01-04-1996")).toBe(periods[0]?.antardashas[1]);
      expect(yield* dasha.current(periods, "31-03-1996")).toEqual({
        mahadasha: null,
        antardasha: null,
      });
    }).pipe(Effect.provide(Dasha.layer)),
  );

  it.effect("returns typed errors for malformed dates and invalid boundaries", () =>
    Effect.gen(function* () {
      const dasha = yield* Dasha.Service;
      const invalidDate = yield* dasha.current([], "1996-04-01").pipe(Effect.flip);
      expect(invalidDate).toMatchObject({ _tag: "DashaTimelineError", operation: "current" });

      const malformed = [
        {
          mahadasha: "Moon" as const,
          start: "01-01-2000",
          end: "31-12-2000",
          antardashas: [
            {
              mahadasha: "Moon" as const,
              antardasha: "Moon" as const,
              start: "31-12-1999",
              end: "01-01-2000",
            },
          ],
        },
      ];
      const invalidBoundary = yield* dasha.current(malformed, "01-01-2000").pipe(Effect.flip);
      expect(invalidBoundary).toMatchObject({
        _tag: "DashaTimelineError",
        operation: "current",
      });
    }).pipe(Effect.provide(Dasha.layer)),
  );

  it.effect("uses the Effect Clock when the query date is omitted", () =>
    Effect.gen(function* () {
      yield* TestClock.setTime(new Date("2000-01-01T00:00:00.000Z").getTime());
      const dasha = yield* Dasha.Service;
      const periods = yield* dasha.calculate(moment, placements);

      expect((yield* dasha.current(periods)).mahadasha?.mahadasha).toBe("Moon");
    }).pipe(Effect.provide(Dasha.layer)),
  );
});
