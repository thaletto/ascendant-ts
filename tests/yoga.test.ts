import { describe, expect, it } from "@effect/vitest";
import { Cause, Deferred, Effect, Fiber, Ref, Schema } from "effect";
import * as Chart from "../src/chart/index.js";
import * as Yoga from "../src/yoga/index.js";
import { definitions, makeCatalog } from "../src/yoga/catalog.js";
import type { YogaDefinition } from "../src/yoga/internal.js";
import { makeLayer } from "../src/yoga/service.js";

const signs = Chart.Rashis.literals;

function calculation(planetHouses: Partial<Record<typeof Chart.Planets.Type, number>>) {
  const completePlanetHouses = {
    Sun: 3,
    Moon: 5,
    Mars: 6,
    Mercury: 8,
    Jupiter: 9,
    Venus: 11,
    Saturn: 12,
    Rahu: 2,
    Ketu: 7,
    ...planetHouses,
  } satisfies Record<typeof Chart.Planets.Type, number>;
  const planets = Object.entries(completePlanetHouses).map(([name, house]) => {
    const signName = signs[(house! - 1) % 12]!;
    return new Chart.Planet({
      name: name as typeof Chart.Planets.Type,
      longitude: Chart.Longitude.make((house! - 1) * 30),
      degree: Chart.Degree.make(0),
      is_retrograde: false,
      in_sign: [],
      sign: new Chart.Sign({ name: signName, lord: "Mars" }),
    });
  });
  const houses = Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => {
      const house = (index + 1) as typeof Chart.Houses.Type;
      return [
        house,
        new Chart.House({
          sign: signs[index]!,
          planets: planets.filter((planet) => completePlanetHouses[planet.name] === house),
          lagna:
            house === 1
              ? new Chart.Lagna({
                  name: "Lagna",
                  longitude: Chart.Longitude.make(0),
                  degree: Chart.Degree.make(0),
                  sign: new Chart.Sign({ name: "Aries", lord: "Mars" }),
                })
              : null,
        }),
      ];
    }),
  ) as Record<typeof Chart.Houses.Type, Chart.House>;
  const sourceLagna = new Chart.SourceLagna({
    name: "Lagna",
    longitude: Chart.Longitude.make(0),
    nakshatra: new Chart.Nakshatra({ name: "Ashwini", lord: "Ketu", pada: 1 }),
  });
  const placements = new Chart.Placements({
    lagna: sourceLagna,
    planets: planets.map(
      (planet) =>
        new Chart.SourcePlanet({
          name: planet.name,
          longitude: planet.longitude,
          is_retrograde: planet.is_retrograde,
          nakshatra: new Chart.Nakshatra({ name: "Ashwini", lord: "Ketu", pada: 1 }),
        }),
    ),
  });
  const bhavaHouses = Object.fromEntries(
    Array.from({ length: 12 }, (_, index) => {
      const house = (index + 1) as typeof Chart.Houses.Type;
      return [
        house,
        new Chart.BhavaHouse({
          cusp: Chart.Longitude.make(index * 30),
          planets: houses[house].planets,
          lagna: houses[house].lagna,
        }),
      ];
    }),
  ) as Record<typeof Chart.Houses.Type, Chart.BhavaHouse>;

  return new Chart.ChartCalculation({
    placements,
    charts: [
      new Chart.Chart({
        provenance: { method: "ascendant-divisional-mapping", version: 1 },
        division: 1,
        houses,
      }),
    ],
    bhava: new Chart.BhavaChart({
      houses: bhavaHouses,
      angles: new Chart.BhavaAngles({
        ascendant: Chart.CircleAngle.make(0),
        mc: Chart.CircleAngle.make(0),
        armc: Chart.CircleAngle.make(0),
        vertex: Chart.CircleAngle.make(0),
        equatorialAscendant: Chart.CircleAngle.make(0),
        coAscendant1: Chart.CircleAngle.make(0),
        coAscendant2: Chart.CircleAngle.make(0),
        polarAscendant: Chart.CircleAngle.make(0),
      }),
    }),
    astroParams: { ayanamsa: "Lahiri", houseSystem: "WholeSign" },
  });
}

function lunarCalculation(overrides: Partial<Record<typeof Chart.Planets.Type, number>> = {}) {
  return calculation({
    Sun: 5,
    Moon: 1,
    Mars: 5,
    Mercury: 5,
    Jupiter: 5,
    Venus: 5,
    Saturn: 5,
    Rahu: 5,
    Ketu: 5,
    ...overrides,
  });
}

describe("Yoga.Service", () => {
  it("publishes immutable descriptors with attributed effects separate from evidence", () => {
    expect(Yoga.catalog).toEqual([
      {
        id: "gajakesari",
        name: "Gajakesari Yoga",
        aliases: ["GajaKesari", "Gajkesari"],
        classification: "Positive",
        description:
          "Traditionally associated with generosity, public responsibility, reputation, and enduring recognition.",
      },
      {
        id: "sunapha",
        name: "Sunapha Yoga",
        aliases: ["Sunaphaa"],
        classification: "Positive",
        description:
          "Traditionally associated with self-earned prosperity, intelligence, sound decisions, and reputation.",
      },
      {
        id: "anapha",
        name: "Anapha Yoga",
        aliases: ["Anaphaa"],
        classification: "Positive",
        description:
          "Traditionally associated with health, dignity, generosity, reputation, comfort, and later austerity.",
      },
      {
        id: "dhurdhua",
        name: "Dhurdhua Yoga",
        aliases: ["Durudhara", "Durdhura", "Durudhura"],
        classification: "Positive",
        description:
          "Traditionally associated with wealth, generosity, charitable conduct, influence, and reputation.",
      },
      {
        id: "kemadruma",
        name: "Kemadruma Yoga",
        aliases: ["KemaDurga", "Kema Druma"],
        classification: "Negative",
        description:
          "Traditionally associated with isolation, hardship, material instability, and dependence on others.",
      },
      {
        id: "chandra_mangala",
        name: "Chandra Mangala Yoga",
        aliases: ["Chandra-Mangala"],
        classification: "Negative",
        description:
          "In the selected catalog convention, traditionally associated with harsh conduct, conflict, and troubled family relations.",
      },
      {
        id: "adhi",
        name: "Adhi Yoga",
        aliases: ["Chandra Adhi"],
        classification: "Positive",
        description:
          "Traditionally associated with trustworthiness, prosperity, comfort, health, longevity, and victory over opposition.",
      },
      {
        id: "chatussagara",
        name: "Chatussagara Yoga",
        aliases: ["Chatusagara"],
        classification: "Positive",
        description:
          "Traditionally associated with broad reputation, health, longevity, prosperity, grace, and capable children.",
      },
      {
        id: "vasumathi",
        name: "Vasumathi Yoga",
        aliases: ["Vasumati"],
        classification: "Positive",
        description:
          "Traditionally associated with diligence, social esteem, prosperity, independence, and generosity.",
      },
      {
        id: "rajalakshana",
        name: "Rajalakshana Yoga",
        aliases: ["Raja Lakshana"],
        classification: "Positive",
        description:
          "Traditionally associated with stature, admirable qualities, respect, dignity, and an attractive appearance.",
      },
    ]);
    expect(Yoga.catalog.every((descriptor) => !("strength" in descriptor))).toBe(true);
    expect(Object.isFrozen(Yoga.catalog)).toBe(true);
  });

  it.effect("evaluates the complete pilot in stable catalog order", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const result = yield* yoga.evaluateAll(calculation({ Moon: 1, Jupiter: 4 }));

      expect(result.provenance).toEqual({ method: "ascendant-yoga", version: 1 });
      expect(result.results.map(({ yoga }) => yoga.id)).toEqual([
        "gajakesari",
        "sunapha",
        "anapha",
        "dhurdhua",
        "kemadruma",
        "chandra_mangala",
        "adhi",
        "chatussagara",
        "vasumathi",
        "rajalakshana",
      ]);
      expect(result.results).toHaveLength(10);
      expect(result.results.some(({ present }) => !present)).toBe(true);
      expect(result.results.every((entry) => !("strength" in entry))).toBe(true);
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("evaluates a selected subset in caller order", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const result = yield* yoga.evaluateSelected(calculation({ Moon: 1, Jupiter: 4 }), [
        "rajalakshana",
        "gajakesari",
      ]);

      expect(result.results.map(({ yoga }) => yoga.id)).toEqual(["rajalakshana", "gajakesari"]);
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("rejects unknown and duplicate selected IDs with typed errors", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const input = calculation({});
      const unknown = yield* yoga.evaluateSelected(input, ["not_a_yoga"]).pipe(Effect.flip);
      expect(unknown).toEqual(new Yoga.UnknownYogaError({ id: "not_a_yoga" }));

      const duplicate = yield* yoga
        .evaluateSelected(input, ["sunapha", "sunapha"])
        .pipe(Effect.flip);
      expect(duplicate).toEqual(
        new Yoga.DuplicateYogaSelectionError({ id: Yoga.YogaIds.make("sunapha") }),
      );
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("rejects an empty selected collection at the schema and service boundaries", () =>
    Effect.gen(function* () {
      const error = yield* Schema.decodeUnknownEffect(Yoga.YogaSelection)([]).pipe(Effect.flip);
      expect(error._tag).toBe("SchemaError");

      const yoga = yield* Yoga.Service;
      const serviceError = yield* yoga.evaluateSelected(calculation({}), []).pipe(Effect.flip);
      expect(serviceError).toEqual(new Yoga.EmptyYogaSelectionError());
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("evaluates Gajakesari in each Kendra from the Moon and across house twelve", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      for (const [moonHouse, jupiterHouse, expectedRelativeHouse] of [
        [1, 1, 1],
        [1, 4, 4],
        [1, 7, 7],
        [1, 10, 10],
        [12, 3, 4],
      ] as const) {
        const result = yield* yoga.evaluateSelected(
          calculation({ Moon: moonHouse, Jupiter: jupiterHouse }),
          ["gajakesari"],
        );
        expect(result.results[0]).toMatchObject({
          present: true,
          evidence: {
            _tag: "BodyPositionsEvidence",
            referenceBody: "Moon",
            expectedRelativeHouses: [1, 4, 7, 10],
            observed: [{ body: "Jupiter", relativeHouse: expectedRelativeHouse }],
            quantifier: "All",
            matched: true,
          },
        });
      }

      const absent = yield* yoga.evaluateSelected(calculation({ Moon: 1, Jupiter: 2 }), [
        "gajakesari",
      ]);
      expect(absent.results[0]).toMatchObject({
        present: false,
        evidence: { observed: [{ body: "Jupiter", relativeHouse: 2 }], matched: false },
      });
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect(
    "explains qualifying, excluded, empty, and multiple occupants for Sunapha and Anapha",
    () =>
      Effect.gen(function* () {
        const yoga = yield* Yoga.Service;
        const present = yield* yoga.evaluateSelected(
          lunarCalculation({ Sun: 2, Mars: 2, Jupiter: 2, Rahu: 2, Ketu: 2, Venus: 12 }),
          ["sunapha", "anapha"],
        );
        expect(present.results[0]).toMatchObject({
          present: true,
          evidence: {
            _tag: "HouseOccupancyEvidence",
            referenceBody: "Moon",
            expectedRelativeHouses: [2],
            observed: [{ relativeHouse: 2, occupants: ["Sun", "Mars", "Jupiter", "Rahu", "Ketu"] }],
            excludedBodies: ["Sun", "Rahu", "Ketu"],
            quantifier: "AnyHouse",
            matched: true,
          },
        });
        expect(present.results[1]).toMatchObject({
          present: true,
          evidence: {
            expectedRelativeHouses: [12],
            observed: [{ relativeHouse: 12, occupants: ["Venus"] }],
            matched: true,
          },
        });

        const excludedOnly = yield* yoga.evaluateSelected(
          lunarCalculation({ Sun: 2, Rahu: 2, Ketu: 2 }),
          ["sunapha", "anapha"],
        );
        expect(excludedOnly.results[0]).toMatchObject({
          present: false,
          evidence: {
            observed: [{ relativeHouse: 2, occupants: ["Sun", "Rahu", "Ketu"] }],
            matched: false,
          },
        });
        expect(excludedOnly.results[1]).toMatchObject({
          present: false,
          evidence: { observed: [{ relativeHouse: 12, occupants: [] }], matched: false },
        });

        const wraparound = yield* yoga.evaluateSelected(
          lunarCalculation({ Moon: 12, Jupiter: 1 }),
          ["sunapha"],
        );
        const wraparoundResult = wraparound.results[0];
        const presentSunapha = present.results[0];
        const absentSunapha = excludedOnly.results[0];
        expect(wraparoundResult).toBeDefined();
        expect(presentSunapha).toBeDefined();
        expect(absentSunapha).toBeDefined();
        if (
          wraparoundResult === undefined ||
          presentSunapha === undefined ||
          absentSunapha === undefined
        ) {
          return;
        }
        expect(wraparoundResult.evidence).toMatchObject({
          observed: [{ relativeHouse: 2, occupants: ["Jupiter"] }],
          matched: true,
        });
        expect(presentSunapha.yoga.description).toBe(absentSunapha.yoga.description);
        expect(presentSunapha.evidence).not.toEqual(absentSunapha.evidence);
      }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("represents Dhurdhua as All evidence and Kemadruma as negated Any evidence", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const occupiedSides = yield* yoga.evaluateSelected(
        lunarCalculation({ Mars: 2, Saturn: 12 }),
        ["dhurdhua", "kemadruma"],
      );
      expect(occupiedSides.results[0]).toMatchObject({
        present: true,
        evidence: {
          _tag: "AllEvidence",
          matched: true,
          children: [
            { _tag: "HouseOccupancyEvidence", expectedRelativeHouses: [2], matched: true },
            { _tag: "HouseOccupancyEvidence", expectedRelativeHouses: [12], matched: true },
          ],
        },
      });
      expect(occupiedSides.results[1]).toMatchObject({
        present: false,
        evidence: {
          _tag: "NotEvidence",
          matched: false,
          child: {
            _tag: "AnyEvidence",
            matched: true,
            children: [
              { expectedRelativeHouses: [2], matched: true },
              { expectedRelativeHouses: [12], matched: true },
            ],
          },
        },
      });

      const emptySides = yield* yoga.evaluateSelected(
        lunarCalculation({ Sun: 2, Rahu: 12, Ketu: 2 }),
        ["dhurdhua", "kemadruma"],
      );
      expect(emptySides.results[0]).toMatchObject({ present: false });
      expect(emptySides.results[1]).toMatchObject({
        present: true,
        evidence: { _tag: "NotEvidence", matched: true, child: { matched: false } },
      });
      const kemadruma = emptySides.results[1];
      expect(kemadruma).toBeDefined();
      if (kemadruma !== undefined) {
        expect(Yoga.formatEvidence(kemadruma.evidence)).toContain("Negated condition matches");
      }
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("evaluates Chandra Mangala conjunction and Adhi benefic placements", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const conjunction = yield* yoga.evaluateSelected(lunarCalculation({ Moon: 12, Mars: 12 }), [
        "chandra_mangala",
      ]);
      expect(conjunction.results[0]).toMatchObject({
        present: true,
        evidence: {
          _tag: "BodyPositionsEvidence",
          observed: [{ body: "Mars", relativeHouse: 1 }],
          matched: true,
        },
      });
      const separated = yield* yoga.evaluateSelected(lunarCalculation({ Mars: 2 }), [
        "chandra_mangala",
      ]);
      expect(separated.results[0]).toMatchObject({
        present: false,
        evidence: { observed: [{ body: "Mars", relativeHouse: 2 }], matched: false },
      });

      const adhi = yield* yoga.evaluateSelected(
        lunarCalculation({ Mercury: 6, Jupiter: 7, Venus: 8 }),
        ["adhi"],
      );
      expect(adhi.results[0]).toMatchObject({
        present: true,
        evidence: {
          expectedRelativeHouses: [6, 7, 8],
          observed: [
            { body: "Mercury", relativeHouse: 6 },
            { body: "Jupiter", relativeHouse: 7 },
            { body: "Venus", relativeHouse: 8 },
          ],
          quantifier: "All",
          matched: true,
        },
      });
      const incompleteAdhi = yield* yoga.evaluateSelected(
        lunarCalculation({ Mercury: 6, Jupiter: 7, Venus: 9 }),
        ["adhi"],
      );
      expect(incompleteAdhi.results[0]).toMatchObject({
        present: false,
        evidence: { observed: [{}, {}, { body: "Venus", relativeHouse: 9 }], matched: false },
      });
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("requires every Kendra to be occupied for Chatussagara", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const occupiedKendras = {
        Sun: 1,
        Moon: 2,
        Mars: 4,
        Mercury: 2,
        Jupiter: 7,
        Venus: 2,
        Saturn: 10,
        Rahu: 2,
        Ketu: 2,
      } satisfies Record<typeof Chart.Planets.Type, number>;
      const present = yield* yoga.evaluateSelected(calculation(occupiedKendras), ["chatussagara"]);
      expect(present.results[0]).toMatchObject({
        present: true,
        evidence: {
          _tag: "HouseOccupancyEvidence",
          referenceBody: "Lagna",
          expectedRelativeHouses: [1, 4, 7, 10],
          observed: [
            { relativeHouse: 1, occupants: ["Sun"] },
            { relativeHouse: 4, occupants: ["Mars"] },
            { relativeHouse: 7, occupants: ["Jupiter"] },
            { relativeHouse: 10, occupants: ["Saturn"] },
          ],
          quantifier: "EveryHouse",
          matched: true,
        },
      });

      for (const [body, emptyHouse] of [
        ["Sun", 1],
        ["Mars", 4],
        ["Jupiter", 7],
        ["Saturn", 10],
      ] as const) {
        const absent = yield* yoga.evaluateSelected(
          calculation({ ...occupiedKendras, [body]: 2 }),
          ["chatussagara"],
        );
        expect(absent.results[0]).toMatchObject({
          present: false,
          evidence: {
            observed: expect.arrayContaining([{ relativeHouse: emptyHouse, occupants: [] }]),
            matched: false,
          },
        });
      }
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("evaluates Vasumathi through Lagna or Moon alternatives", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const fromLagna = yield* yoga.evaluateSelected(lunarCalculation({ Moon: 4, Mercury: 3 }), [
        "vasumathi",
      ]);
      expect(fromLagna.results[0]).toMatchObject({
        present: true,
        evidence: {
          _tag: "AnyEvidence",
          matched: true,
          children: [
            {
              _tag: "BodyPositionsEvidence",
              referenceBody: "Lagna",
              quantifier: "Any",
              observed: expect.arrayContaining([{ body: "Mercury", relativeHouse: 3 }]),
              matched: true,
            },
            { referenceBody: "Moon", matched: false },
          ],
        },
      });

      const fromMoon = yield* yoga.evaluateSelected(
        lunarCalculation({ Moon: 5, Mercury: 2, Jupiter: 7, Venus: 4 }),
        ["vasumathi"],
      );
      expect(fromMoon.results[0]).toMatchObject({
        present: true,
        evidence: {
          _tag: "AnyEvidence",
          children: [
            { referenceBody: "Lagna", matched: false },
            {
              referenceBody: "Moon",
              observed: expect.arrayContaining([{ body: "Jupiter", relativeHouse: 3 }]),
              matched: true,
            },
          ],
          matched: true,
        },
      });

      const neither = yield* yoga.evaluateSelected(
        lunarCalculation({ Moon: 1, Mercury: 2, Jupiter: 4, Venus: 5 }),
        ["vasumathi"],
      );
      expect(neither.results[0]).toMatchObject({
        present: false,
        evidence: {
          _tag: "AnyEvidence",
          children: [{ matched: false }, { matched: false }],
          matched: false,
        },
      });
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("requires Moon and every selected benefic in a Kendra for Rajalakshana", () =>
    Effect.gen(function* () {
      const yoga = yield* Yoga.Service;
      const kendraBodies = {
        Moon: 1,
        Mercury: 4,
        Jupiter: 7,
        Venus: 10,
      } as const;
      const present = yield* yoga.evaluateSelected(lunarCalculation(kendraBodies), [
        "rajalakshana",
      ]);
      expect(present.results[0]).toMatchObject({
        present: true,
        evidence: {
          _tag: "BodyPositionsEvidence",
          referenceBody: "Lagna",
          bodies: ["Moon", "Mercury", "Jupiter", "Venus"],
          expectedRelativeHouses: [1, 4, 7, 10],
          observed: [
            { body: "Moon", relativeHouse: 1 },
            { body: "Mercury", relativeHouse: 4 },
            { body: "Jupiter", relativeHouse: 7 },
            { body: "Venus", relativeHouse: 10 },
          ],
          quantifier: "All",
          matched: true,
        },
      });

      for (const body of ["Moon", "Mercury", "Jupiter", "Venus"] as const) {
        const absent = yield* yoga.evaluateSelected(
          lunarCalculation({ ...kendraBodies, [body]: 2 }),
          ["rajalakshana"],
        );
        expect(absent.results[0]).toMatchObject({
          present: false,
          evidence: {
            observed: expect.arrayContaining([{ body, relativeHouse: 2 }]),
            matched: false,
          },
        });
      }
    }).pipe(Effect.provide(Yoga.layer)),
  );

  it.effect("preflights missing Divisions atomically before starting rule evaluation", () =>
    Effect.gen(function* () {
      const starts = yield* Ref.make(0);
      const d9Definition: YogaDefinition = {
        ...definitions[0]!,
        requiredDivisions: [9],
        condition: {
          _tag: "BodyPositionsCondition",
          division: 9,
          referenceBody: "Moon",
          bodies: ["Jupiter"],
          expectedRelativeHouses: [1, 4, 7, 10],
          quantifier: "All",
        },
      };
      const testLayer = makeLayer([d9Definition], {
        hooks: {
          onStart: () => Ref.update(starts, (count) => count + 1),
          onFinish: () => Effect.void,
        },
      });
      const error = yield* Effect.gen(function* () {
        const yoga = yield* Yoga.Service;
        return yield* yoga.evaluateAll(calculation({})).pipe(Effect.flip);
      }).pipe(Effect.provide(testLayer));

      expect(error).toEqual(
        new Yoga.MissingYogaEvidenceError({
          affectedYogaIds: [Yoga.YogaIds.make("gajakesari")],
          missingDivisions: [9],
        }),
      );
      expect(yield* Ref.get(starts)).toBe(0);
    }),
  );

  it.effect("runs no more than four rule evaluations concurrently and preserves order", () =>
    Effect.gen(function* () {
      const active = yield* Ref.make(0);
      const maximum = yield* Ref.make(0);
      const fourStarted = yield* Deferred.make<void>();
      const release = yield* Deferred.make<void>();
      const testLayer = makeLayer(undefined, {
        hooks: {
          onStart: () =>
            Effect.gen(function* () {
              const current = yield* Ref.updateAndGet(active, (count) => count + 1);
              yield* Ref.update(maximum, (value) => Math.max(value, current));
              if (current === 4) yield* Deferred.succeed(fourStarted, void 0);
              yield* Deferred.await(release);
            }),
          onFinish: () => Ref.update(active, (count) => count - 1),
        },
      });
      const fiber = yield* Effect.gen(function* () {
        const yoga = yield* Yoga.Service;
        return yield* yoga.evaluateAll(calculation({}));
      }).pipe(Effect.provide(testLayer), Effect.forkChild);

      yield* Deferred.await(fourStarted);
      expect(yield* Ref.get(maximum)).toBe(4);
      yield* Deferred.succeed(release, void 0);
      const result = yield* Fiber.join(fiber);
      expect(result.results.map(({ yoga }) => yoga.id)).toEqual(Yoga.catalog.map(({ id }) => id));
      expect(yield* Ref.get(maximum)).toBe(4);
      expect(yield* Ref.get(active)).toBe(0);
    }),
  );

  it.effect("does not translate evaluator defects into ordinary Yoga errors", () =>
    Effect.gen(function* () {
      const defective: YogaDefinition = {
        yoga: definitions[0]!.yoga,
        requiredDivisions: [1],
        evaluator: {
          name: "defective-test-evaluator",
          evaluate: () => {
            throw new Error("test evaluator invariant");
          },
        },
        sources: ["test"],
      };
      const exit = yield* Effect.gen(function* () {
        const yoga = yield* Yoga.Service;
        return yield* yoga.evaluateAll(calculation({})).pipe(Effect.exit);
      }).pipe(Effect.provide(makeLayer([defective])));
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        expect(Cause.hasDies(exit.cause)).toBe(true);
        expect(Cause.pretty(exit.cause)).toContain("test evaluator invariant");
      }
    }),
  );

  it("rejects duplicate IDs and aliases while assembling an internal catalog", () => {
    expect(() => makeCatalog([definitions[0]!, definitions[0]!])).toThrow(
      "Duplicate Yoga ID: gajakesari",
    );
    const second = definitions[1]!.yoga;
    const duplicateAlias: YogaDefinition = {
      ...definitions[1]!,
      yoga: {
        id: second.id,
        name: second.name,
        aliases: [definitions[0]!.yoga.aliases[0]!],
        classification: second.classification,
        description: second.description,
      },
    };
    expect(() => makeCatalog([definitions[0]!, duplicateAlias])).toThrow(
      "Duplicate or empty Yoga alias: GajaKesari",
    );
    expect(() =>
      makeCatalog([
        {
          ...definitions[0]!,
          requiredDivisions: [1, 9],
        },
      ]),
    ).toThrow("Yoga gajakesari condition and required Divisions disagree");
  });
});
