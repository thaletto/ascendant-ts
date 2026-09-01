import { Effect } from "effect";

import * as Chart from "../src/chart/index.js";
import { definitions, makeCatalog } from "../src/yoga/catalog.js";
import { evaluateDefinition, makeEvaluationIndex } from "../src/yoga/evaluate.js";
import * as Yoga from "../src/yoga/index.js";
import type { YogaDefinition } from "../src/yoga/internal.js";

const signs = Chart.Rashis.literals;
const planetHouses: Record<typeof Chart.Planets.Type, typeof Chart.Houses.Type> = {
  Sun: 1,
  Moon: 1,
  Mars: 2,
  Mercury: 6,
  Jupiter: 7,
  Venus: 8,
  Saturn: 12,
  Rahu: 3,
  Ketu: 9,
};

const planets = Chart.Planets.literals.map((name) => {
  const house = planetHouses[name];
  const signName = signs[house - 1]!;
  return new Chart.Planet({
    name,
    longitude: Chart.Longitude.make((house - 1) * 30),
    degree: Chart.Degree.make(0),
    is_retrograde: false,
    in_sign: [],
    sign: new Chart.Sign({ name: signName, lord: "Mars" }),
  });
});

const lagna = new Chart.Lagna({
  name: "Lagna",
  longitude: Chart.Longitude.make(0),
  degree: Chart.Degree.make(0),
  sign: new Chart.Sign({ name: "Aries", lord: "Mars" }),
});

const houses = Object.fromEntries(
  Chart.Houses.literals.map((house) => [
    house,
    new Chart.House({
      sign: signs[house - 1]!,
      planets: planets.filter((planet) => planetHouses[planet.name] === house),
      lagna: house === 1 ? lagna : null,
    }),
  ]),
) as Record<typeof Chart.Houses.Type, Chart.House>;

const sourceLagna = new Chart.SourceLagna({
  name: "Lagna",
  longitude: Chart.Longitude.make(0),
  nakshatra: new Chart.Nakshatra({ name: "Ashwini", lord: "Ketu", pada: 1 }),
});
const calculation = new Chart.ChartCalculation({
  placements: new Chart.Placements({
    lagna: sourceLagna,
    planets: planets.map(
      (planet) =>
        new Chart.SourcePlanet({
          name: planet.name,
          longitude: planet.longitude,
          is_retrograde: false,
          nakshatra: new Chart.Nakshatra({ name: "Ashwini", lord: "Ketu", pada: 1 }),
        }),
    ),
  }),
  charts: [
    new Chart.Chart({
      provenance: { method: "ascendant-divisional-mapping", version: "1" },
      division: 1,
      houses,
    }),
  ],
  bhava: new Chart.BhavaChart({
    houses: Object.fromEntries(
      Chart.Houses.literals.map((house) => [
        house,
        new Chart.BhavaHouse({
          cusp: Chart.Longitude.make((house - 1) * 30),
          planets: houses[house].planets,
          lagna: houses[house].lagna,
        }),
      ]),
    ) as Record<typeof Chart.Houses.Type, Chart.BhavaHouse>,
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

function syntheticCatalog(size: number): readonly YogaDefinition[] {
  return Array.from({ length: size }, (_, index) => {
    const source = definitions[index % definitions.length]!;
    const common = {
      yoga: {
        id: Yoga.YogaIds.make(`synthetic_${index}`),
        name: `Synthetic Yoga ${index}`,
        aliases: [`Synthetic ${index}`],
        classification: source.yoga.classification,
        description: source.yoga.description,
      },
      requiredDivisions: source.requiredDivisions,
      strategy: source.strategy,
    };
    return common;
  });
}

async function measure(
  catalog: readonly YogaDefinition[],
  iterations: number,
  concurrency: 1 | 4,
): Promise<number> {
  const program = Effect.gen(function* () {
    const validatedCatalog = yield* makeCatalog(catalog);
    const evaluateCatalog = () =>
      Effect.gen(function* () {
        const index = makeEvaluationIndex(calculation);
        return yield* Effect.all(
          validatedCatalog.map((definition) => evaluateDefinition(definition, index)),
          { concurrency },
        );
      });

    for (let index = 0; index < 100; index++) yield* evaluateCatalog();
    const startedAt = performance.now();
    for (let index = 0; index < iterations; index++) yield* evaluateCatalog();
    return performance.now() - startedAt;
  });
  return Effect.runPromise(program);
}

const pilotIterations = 2_000;
const syntheticIterations = 250;
const synthetic = syntheticCatalog(300);
const pilotSequential = await measure(definitions, pilotIterations, 1);
const pilotBounded = await measure(definitions, pilotIterations, 4);
const syntheticSequential = await measure(synthetic, syntheticIterations, 1);
const syntheticBounded = await measure(synthetic, syntheticIterations, 4);

console.log(`Yoga Service pilot (${pilotIterations} ten-rule evaluations)`);
console.log(`concurrency 1: ${(pilotSequential / 1000).toFixed(2)} s`);
console.log(`concurrency 4: ${(pilotBounded / 1000).toFixed(2)} s`);
console.log(`Yoga Service scale sample (${syntheticIterations} 300-rule evaluations)`);
console.log(`concurrency 1: ${(syntheticSequential / 1000).toFixed(2)} s`);
console.log(`concurrency 4: ${(syntheticBounded / 1000).toFixed(2)} s`);
console.log(
  "This benchmark is non-gating. Fiber concurrency does not imply four-core execution for synchronous predicates.",
);
