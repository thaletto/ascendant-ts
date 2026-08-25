import { Effect } from "effect";

import { SIGN_LORDS } from "../internal/constant.js";
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
} from "../internal/model.js";
import { getDivisionalTarget } from "./divisional-mapping/calculate.js";
import { ChartCalculationError } from "./error.js";
import { inSignStatus } from "./helper.js";

const chartFromMappedPlacements = Effect.fn("astro-ascendant/chart/chartFromMappedPlacements")(
  function* ({
    division,
    lagna,
    planets,
  }: {
    readonly division: Division;
    readonly lagna: Lagna;
    readonly planets: readonly Planet[];
  }) {
    const houses = {} as Record<Houses, House>;
    const lagnaSignIndex = Rashis.literals.indexOf(lagna.sign.name);
    for (let index = 0; index < 12; index++) {
      const house = (index + 1) as Houses;
      const houseSign = Rashis.literals[(lagnaSignIndex + index) % 12]!;
      houses[house] = House.make({
        sign: houseSign,
        planets: planets.filter((planet) => planet.sign.name === houseSign),
        lagna: house === 1 ? lagna : null,
      });
    }

    return Chart.make({
      provenance: {
        method: "ascendant-divisional-mapping",
        version: "1",
      },
      division,
      houses,
    });
  },
);

export const chartFromPlacements = Effect.fn("astro-ascendant/chart/chartFromPlacements")(
  function* (placements: Placements, division: Division) {
    const lagna = yield* getDivisionalTarget(placements.lagna.longitude, division).pipe(
      Effect.map((mapped) => {
        const mappedSign = Rashis.literals[mapped.signIndex]!;
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
            const mappedSign = Rashis.literals[mapped.signIndex]!;
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

    return yield* chartFromMappedPlacements({ division, lagna, planets });
  },
);

export const chartsFromPlacements = Effect.fn("astro-ascendant/chart/chartsFromPlacements")(
  function* (placements: Placements, divisions: readonly [Division, ...Division[]]) {
    const [firstDivision, ...remainingDivisions] = divisions;
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
