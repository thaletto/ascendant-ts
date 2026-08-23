import { Effect, pipe } from "effect";
import { ChartCalculationError } from "./error.js";
import { getDivisionalTarget } from "./divisional-mapping.js";
import {
  Chart,
  type Division,
  House,
  Houses,
  Lagna,
  type Placements,
  Planet,
  Rashis,
  Sign,
} from "./model.js";
import { inSignStatus, SIGN_LORDS } from "./tables.js";

function sign(name: typeof Rashis.Type): Sign {
  return new Sign({ name, lord: SIGN_LORDS[name] });
}

function chartFromMappedPlacements({
  division,
  lagna,
  planets,
}: {
  readonly division: typeof Division.Type;
  readonly lagna: Lagna;
  readonly planets: readonly Planet[];
}): Chart {
  const houses = {} as Record<typeof Houses.Type, House>;
  const lagnaSignIndex = Rashis.literals.indexOf(lagna.sign.name);
  for (let index = 0; index < 12; index++) {
    const house = (index + 1) as typeof Houses.Type;
    const houseSign = Rashis.literals[(lagnaSignIndex + index) % 12]!;
    houses[house] = new House({
      sign: houseSign,
      planets: planets.filter((planet) => planet.sign.name === houseSign),
      lagna: house === 1 ? lagna : null,
    });
  }

  return new Chart({
    provenance: {
      method: "ascendant-divisional-mapping",
      version: 1,
    },
    division,
    houses,
  });
}

export const chartFromPlacements = Effect.fn("Chart.chartFromPlacements")(function* (
  placements: Placements,
  division: typeof Division.Type,
) {
  const lagna = yield* getDivisionalTarget(placements.lagna.longitude, division).pipe(
    Effect.map((mapped) => {
      const mappedSign = Rashis.literals[mapped.signIndex]!;
      return new Lagna({
        name: "Lagna",
        longitude: mapped.longitude,
        degree: mapped.degree,
        sign: sign(mappedSign),
      });
    }),
  );

  const planets = yield* Effect.all(
    placements.planets.map((source) =>
      getDivisionalTarget(source.longitude, division).pipe(
        Effect.map((mapped) => {
          const mappedSign = Rashis.literals[mapped.signIndex]!;
          return new Planet({
            name: source.name,
            longitude: mapped.longitude,
            degree: mapped.degree,
            is_retrograde: source.is_retrograde,
            in_sign: [...inSignStatus(source.name, mappedSign, mapped.degree)],
            sign: sign(mappedSign),
          });
        }),
      ),
    ),
    { concurrency: "unbounded" },
  );

  return pipe({ division, lagna, planets }, chartFromMappedPlacements);
});

export const chartsFromPlacements = Effect.fn("Chart.chartsFromPlacements")(
  function* (
    placements: Placements,
    divisions: readonly [typeof Division.Type, ...(typeof Division.Type)[]],
  ) {
    const [firstDivision, ...remainingDivisions] = divisions;
    const firstChart = yield* chartFromPlacements(placements, firstDivision);
    const remainingCharts = yield* Effect.all(
      remainingDivisions.map((division) => chartFromPlacements(placements, division)),
      { concurrency: "unbounded" },
    );

    return [firstChart, ...remainingCharts] as [Chart, ...Chart[]];
  },
  Effect.mapError(
    (cause) =>
      new ChartCalculationError({
        stage: "mapping",
        message: "Could not map one or more requested Divisions",
        cause,
      }),
  ),
);
