import { Effect } from "effect";

import { getDivisionalTarget } from "./divisional-mapping.js";
import { ChartCalculationError } from "./error.js";
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
  return Sign.make({ name, lord: SIGN_LORDS[name] });
}

const chartFromMappedPlacements = Effect.fn("astro-ascendant/chart/chartFromMappedPlacements")(
  function* ({
    division,
    lagna,
    planets,
  }: {
    readonly division: typeof Division.Type;
    readonly lagna: Lagna;
    readonly planets: readonly Planet[];
  }) {
    const houses = {} as Record<typeof Houses.Type, House>;
    const lagnaSignIndex = Rashis.literals.indexOf(lagna.sign.name);
    for (let index = 0; index < 12; index++) {
      const house = (index + 1) as typeof Houses.Type;
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
        version: 1,
      },
      division,
      houses,
    });
  },
);

export const chartFromPlacements = Effect.fn("astro-ascendant/chart/chartFromPlacements")(
  function* (placements: Placements, division: typeof Division.Type) {
    const lagna = yield* getDivisionalTarget(placements.lagna.longitude, division).pipe(
      Effect.map((mapped) => {
        const mappedSign = Rashis.literals[mapped.signIndex]!;
        return Lagna.make({
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
            return Planet.make({
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

    return yield* chartFromMappedPlacements({ division, lagna, planets });
  },
);

export const chartsFromPlacements = Effect.fn("astro-ascendant/chart/chartsFromPlacements")(
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
  Effect.mapError((cause) =>
    ChartCalculationError.make({
      stage: "mapping",
      message: "Could not map one or more requested Divisions",
      cause,
    }),
  ),
);
