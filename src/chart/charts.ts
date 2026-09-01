import { Array, Effect, Order, pipe, Record as Struct } from "effect";

import { methods } from "../provenance.js";
import { getDivisionalTarget } from "./divisional-mapping/calculate.js";
import { ChartCalculationError } from "./error.js";
import { inSignStatus } from "./helper.js";
import { SIGN_LORDS } from "./internal/constants.js";
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

/**
 * Assembles a Whole Sign chart from division-mapped Lagna and planet positions.
 * House one is the mapped Lagna sign and every following house advances one sign.
 */
function chartFromMappedPlacements({
  division,
  lagna,
  planets,
}: {
  readonly division: Division;
  readonly lagna: Lagna;
  readonly planets: readonly Planet[];
}): Chart {
  const lagnaSignIndex = Rashis.literals.indexOf(lagna.sign.name);
  const houses = Struct.fromEntries(
    Array.range(0, 11).map((index) => {
      const house = (index + 1) as Houses;
      const houseSign = Array.getUnsafe(Rashis.literals, (lagnaSignIndex + index) % 12);
      return [
        String(house),
        House.make({
          sign: houseSign,
          planets: planets.filter((planet) => planet.sign.name === houseSign),
          lagna: house === 1 ? lagna : null,
        }),
      ] as const;
    }),
  ) as Record<Houses, House>;

  return Chart.make({
    provenance: methods.chartProjection.provenance,
    division,
    houses,
  });
}

/** Maps canonical D1 Placements into one requested division before house assembly. */
const chartFromPlacements = Effect.fn("astro-ascendant/chart/chartFromPlacements")(function* (
  placements: Placements,
  division: Division,
) {
  const lagna = yield* getDivisionalTarget(placements.lagna.longitude, division).pipe(
    Effect.map((mapped) => {
      const mappedSign = Array.getUnsafe(Rashis.literals, mapped.signIndex);
      return Lagna.make({
        name: "Lagna",
        longitude: mapped.longitude,
        degree: mapped.degree,
        sign: Sign.make({
          name: mappedSign,
          lord: SIGN_LORDS[mappedSign],
        }),
      });
    }),
  );

  const planets = yield* Effect.all(
    placements.planets.map((source) =>
      getDivisionalTarget(source.longitude, division).pipe(
        Effect.map((mapped) => {
          const mappedSign = Array.getUnsafe(Rashis.literals, mapped.signIndex);
          return Planet.make({
            name: source.name,
            longitude: mapped.longitude,
            degree: mapped.degree,
            is_retrograde: source.is_retrograde,
            in_sign: inSignStatus(source.name, source.longitude),
            sign: Sign.make({
              name: mappedSign,
              lord: SIGN_LORDS[mappedSign],
            }),
          });
        }),
      ),
    ),
    { concurrency: "unbounded" },
  );

  return chartFromMappedPlacements({ division, lagna, planets });
});

function requestedDivisions(divisions: readonly Division[]): readonly [Division, ...Division[]] {
  const requested = pipe(
    divisions,
    Array.filter((division) => division !== 1),
    Array.dedupe,
    Array.sort(Order.Number),
  );

  return [1, ...requested];
}

/**
 * Projects D1 plus requested divisional charts from shared Placements. D1 is
 * always first; duplicate requests are removed and remaining divisions sort in
 * ascending numeric order, preserving a stable calculation result.
 */
export const project = Effect.fn("astro-ascendant/chart/project")(
  function* (placements: Placements, divisions: readonly Division[] = []) {
    const requested = requestedDivisions(divisions);
    const [firstDivision, ...remainingDivisions] = requested;
    const firstChart = yield* chartFromPlacements(placements, firstDivision);
    const remainingCharts = yield* Effect.all(
      remainingDivisions.map((division) => chartFromPlacements(placements, division)),
      { concurrency: "unbounded" },
    );

    return [firstChart, ...remainingCharts] as [Chart, ...Chart[]];
  },
  Effect.mapError((cause) =>
    ChartCalculationError.make({
      stage: "mapping",
      message: "Could not map one or more requested Divisions",
      cause,
    }),
  ),
);
