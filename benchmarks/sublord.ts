import { Array, Console, Effect, Option, Record } from "effect";

import type { ExampleInput } from "../examples/input.ts";
import { subLordOf } from "../src/chart/helper.ts";
import { AstroParams, Chart } from "../src/index.ts";

const HOUSES = Chart.Houses.literals;
const BASELINE_AYANAMSA = "Krishnamurti" satisfies typeof AstroParams.Ayanamsa.Type;
const BASELINE_HOUSE_SYSTEM = "Placidus" satisfies typeof AstroParams.HouseSystem.Type;

const AYANAMSA_HOUSE_SYSTEMS = [
  ["Lahiri", ["WholeSign", "Equal", "Placidus"]],
  ["Raman", ["WholeSign", "Equal", "Placidus"]],
  ["Krishnamurti", ["Placidus", "Regiomontanus", "Campanus", "Equal"]],
  ["JNBhasin", ["WholeSign", "Equal", "Placidus"]],
  ["TrueCitra", ["WholeSign", "Equal", "Placidus"]],
  ["TrueRevati", ["WholeSign", "Equal", "Placidus"]],
  ["TruePushya", ["WholeSign", "Equal", "Placidus"]],
] as const satisfies ReadonlyArray<
  readonly [typeof AstroParams.Ayanamsa.Type, readonly (typeof AstroParams.HouseSystem.Type)[]]
>;

type Combination = {
  readonly ayanamsa: typeof AstroParams.Ayanamsa.Type;
  readonly houseSystem: typeof AstroParams.HouseSystem.Type;
};

type HouseLords = {
  readonly house: Chart.Houses;
  readonly cusp: number;
  readonly signLord: Chart.PlanetsLagna | undefined;
  readonly starLord: Chart.PlanetsLagna | undefined;
  readonly subLord: Chart.PlanetsLagna | undefined;
};

type PointSublord = {
  readonly name: string;
  readonly longitude: number;
  readonly subLord: Chart.Planets;
};

type CombinationSnapshot = {
  readonly combination: Combination;
  readonly houses: readonly HouseLords[];
  readonly points: readonly PointSublord[];
};

type HouseDeviation = {
  readonly combination: Combination;
  readonly house: Chart.Houses;
  readonly baselineSubLord: Chart.PlanetsLagna | undefined;
  readonly subLord: Chart.PlanetsLagna | undefined;
  readonly cuspDelta: number;
};

function combinations(): readonly Combination[] {
  return AYANAMSA_HOUSE_SYSTEMS.flatMap(([ayanamsa, houseSystems]) =>
    houseSystems.map((houseSystem) => ({ ayanamsa, houseSystem })),
  );
}

function combinationLabel(combination: Combination): string {
  return `${combination.ayanamsa} / ${combination.houseSystem}`;
}

function isBaseline(combination: Combination): boolean {
  return (
    combination.ayanamsa === BASELINE_AYANAMSA && combination.houseSystem === BASELINE_HOUSE_SYSTEM
  );
}

function circularDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance);
}

function mean(values: readonly number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function houseLordsOf(chart: Chart.Chart): readonly HouseLords[] {
  return HOUSES.map((house) => {
    const data = chart.houses[house];
    return {
      house,
      cusp: data.cusp ?? 0,
      signLord: data.signLord,
      starLord: data.starLord,
      subLord: data.subLord,
    };
  });
}

function pointSublordsOf(placements: Chart.Placements): readonly PointSublord[] {
  return [
    {
      name: placements.lagna.name,
      longitude: placements.lagna.longitude,
      subLord: subLordOf(placements.lagna.longitude),
    },
    ...placements.planets.map((planet) => ({
      name: planet.name,
      longitude: planet.longitude,
      subLord: subLordOf(planet.longitude),
    })),
  ];
}

function snapshotOf(
  combination: Combination,
  calculation: Chart.ChartCalculation,
): CombinationSnapshot {
  return {
    combination,
    houses: houseLordsOf(calculation.charts[0]),
    points: pointSublordsOf(calculation.placements),
  };
}

function houseByNumber(houses: readonly HouseLords[], house: Chart.Houses): HouseLords | undefined {
  return houses.find((item) => item.house === house);
}

function countMatches(
  baseline: readonly HouseLords[],
  candidate: readonly HouseLords[],
  field: "signLord" | "starLord" | "subLord",
): number {
  return HOUSES.filter((house) => {
    const left = houseByNumber(baseline, house);
    const right = houseByNumber(candidate, house);
    return left !== undefined && right !== undefined && left[field] === right[field];
  }).length;
}

function houseDeviations(
  baseline: CombinationSnapshot,
  candidate: CombinationSnapshot,
): readonly HouseDeviation[] {
  return HOUSES.flatMap((house) => {
    const left = houseByNumber(baseline.houses, house);
    const right = houseByNumber(candidate.houses, house);
    if (left === undefined || right === undefined || left.subLord === right.subLord) {
      return [];
    }
    return [
      {
        combination: candidate.combination,
        house,
        baselineSubLord: left.subLord,
        subLord: right.subLord,
        cuspDelta: circularDistance(left.cusp, right.cusp),
      },
    ];
  });
}

function cuspDeltas(
  baseline: readonly HouseLords[],
  candidate: readonly HouseLords[],
): readonly number[] {
  return HOUSES.flatMap((house) => {
    const left = houseByNumber(baseline, house);
    const right = houseByNumber(candidate, house);
    return left === undefined || right === undefined
      ? []
      : [circularDistance(left.cusp, right.cusp)];
  });
}

function displayDegrees(value: number): number {
  return Number(value.toFixed(4));
}

const snapshotFor = Effect.fn("Benchmarks.sublordBenchmark.snapshotFor")(function* (
  input: ExampleInput,
  combination: Combination,
) {
  const calculation = yield* Chart.generate(
    Chart.LocatedMoment.make({
      moment: input.moment,
      latitude: input.latitude,
      longitude: input.longitude,
    }),
  ).pipe(Effect.provide(AstroParams.layer(AstroParams.Options.make(combination))));
  return snapshotOf(combination, calculation);
});

export const sublordBenchmark = Effect.fn("Benchmarks.sublordBenchmark")(function* (
  input: ExampleInput,
) {
  const matrix = combinations();
  const snapshots = yield* Effect.forEach(
    matrix,
    (combination) => snapshotFor(input, combination),
    {
      concurrency: 1,
    },
  );
  const baseline = yield* Option.match(
    Array.findFirst(snapshots, (snapshot) => isBaseline(snapshot.combination)),
    {
      onNone: () =>
        Effect.fail(
          new Error(
            `Baseline ${BASELINE_AYANAMSA} / ${BASELINE_HOUSE_SYSTEM} is missing from the combination matrix.`,
          ),
        ),
      onSome: (snapshot) => Effect.succeed(snapshot),
    },
  );

  yield* Console.log(
    `Sublord deviation vs ${combinationLabel(baseline.combination)} (D1 house cusps)`,
  );
  yield* Console.log(
    `Moment ${input.moment.date.toString()} at ${input.latitude}, ${input.longitude}`,
  );

  yield* Console.log("");
  yield* Console.log("House sublord summary");
  yield* Console.table(
    snapshots.map((snapshot) => {
      const deltas = cuspDeltas(baseline.houses, snapshot.houses);
      return {
        Combination: combinationLabel(snapshot.combination),
        Baseline: isBaseline(snapshot.combination) ? "yes" : "no",
        "Sub matches": `${countMatches(baseline.houses, snapshot.houses, "subLord")}/${HOUSES.length}`,
        "Star matches": `${countMatches(baseline.houses, snapshot.houses, "starLord")}/${HOUSES.length}`,
        "Sign matches": `${countMatches(baseline.houses, snapshot.houses, "signLord")}/${HOUSES.length}`,
        "Mean cusp Δ°": displayDegrees(mean(deltas)),
        "Max cusp Δ°": displayDegrees(Math.max(0, ...deltas)),
      };
    }),
  );

  yield* Console.log("House cusp sublords");
  yield* Console.table(
    snapshots.map((snapshot) => ({
      Combination: combinationLabel(snapshot.combination),
      ...Record.fromEntries(
        snapshot.houses.map((house) => [`H${house.house}`, house.subLord ?? "—"] as const),
      ),
    })),
  );

  const mismatches = snapshots.flatMap((snapshot) =>
    isBaseline(snapshot.combination) ? [] : houseDeviations(baseline, snapshot),
  );
  yield* Console.log("House sublord mismatches");
  yield* Console.table(
    mismatches.length === 0
      ? [{ House: "—", Combination: "none", Baseline: "—", Observed: "—", "Cusp Δ°": "—" }]
      : mismatches.map((row) => ({
          House: row.house,
          Combination: combinationLabel(row.combination),
          Baseline: row.baselineSubLord ?? "—",
          Observed: row.subLord ?? "—",
          "Cusp Δ°": displayDegrees(row.cuspDelta),
        })),
  );

  const ayanamsaSnapshots = AYANAMSA_HOUSE_SYSTEMS.flatMap(([ayanamsa]) => {
    const snapshot = snapshots.find((item) => item.combination.ayanamsa === ayanamsa);
    return snapshot === undefined ? [] : [{ ayanamsa, snapshot }];
  });
  const baselinePoints = baseline.points;

  yield* Console.log("Point sublords by ayanamsa (house system independent)");
  yield* Console.table(
    baselinePoints.map((point) => {
      const observed = Record.fromEntries(
        ayanamsaSnapshots.map(({ ayanamsa, snapshot }) => {
          const match = snapshot.points.find((item) => item.name === point.name);
          return [ayanamsa, match?.subLord ?? "—"] as const;
        }),
      );
      const mismatchesVsBaseline = ayanamsaSnapshots.filter(({ snapshot }) => {
        const match = snapshot.points.find((item) => item.name === point.name);
        return match !== undefined && match.subLord !== point.subLord;
      }).length;
      return {
        Point: point.name,
        ...observed,
        "Mismatches vs KP": mismatchesVsBaseline,
      };
    }),
  );
});
