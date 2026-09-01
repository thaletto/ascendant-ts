import { Effect } from "effect";

import type { Moment, Placements, Planets } from "../chart/model.js";
import { Calendar } from "./calendar.js";
import { DashaCalculationError } from "./error.js";
import { AntarDasha, MahaDasha } from "./model.js";

const VIMSHOTTARI_PLANETS = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const satisfies readonly Planets[];

const VIMSHOTTARI_YEARS: Readonly<Record<(typeof VIMSHOTTARI_PLANETS)[number], number>> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17,
};

const NAKSHATRA_ARC_MINUTES = 800;
const VIMSHOTTARI_CYCLE_YEARS = 120;

function rotate<T>(values: readonly T[], start: number): readonly T[] {
  return [...values.slice(start), ...values.slice(0, start)];
}

/**
 * Derives the nine Vimshottari Mahadashas from the Moon's nakshatra and birth
 * balance. Each Mahadasha contains proportional Antardashas in cyclic order;
 * the final child is set to the parent end to retain contiguous UTC intervals.
 */
export const calculate = Effect.fn("astro-ascendant/dasha/calculate")(
  function* (moment: Moment, placements: Placements) {
    const moon = placements.planets.find((planet) => planet.name === "Moon");
    if (moon === undefined) {
      return yield* DashaCalculationError.make({
        message: "Placements must contain the Moon",
        cause: placements,
      });
    }
    const nakshatraLord = moon?.nakshatra.lord;
    const startIndex = VIMSHOTTARI_PLANETS.indexOf(nakshatraLord);
    const sequence = rotate(VIMSHOTTARI_PLANETS, startIndex);
    const nakshatraIndex = Math.floor(moon.longitude / (360 / 27));
    const nakshatraStart = nakshatraIndex * NAKSHATRA_ARC_MINUTES;
    const elapsedArcMinutes = Math.round(moon.longitude * 60 * 100) / 100 - nakshatraStart;
    const remainingArcMinutes = NAKSHATRA_ARC_MINUTES - elapsedArcMinutes;
    const lordYears = VIMSHOTTARI_YEARS[nakshatraLord];
    const elapsedYears = lordYears - (lordYears / NAKSHATRA_ARC_MINUTES) * remainingArcMinutes;

    let mahadashaStart = Calendar.shiftDate(moment.date, elapsedYears, -1);
    return sequence.map((mahadasha) => {
      const mahadashaYears = VIMSHOTTARI_YEARS[mahadasha];
      const mahadashaEnd = Calendar.shiftDate(mahadashaStart, mahadashaYears, 1);
      const antardashaSequence = rotate(sequence, sequence.indexOf(mahadasha));
      let antardashaStart = mahadashaStart;
      let elapsedAntardashaYears = 0;

      const antardashas = antardashaSequence.map((antardasha, index) => {
        elapsedAntardashaYears +=
          (mahadashaYears * VIMSHOTTARI_YEARS[antardasha]) / VIMSHOTTARI_CYCLE_YEARS;
        const antardashaEnd =
          index === antardashaSequence.length - 1
            ? mahadashaEnd
            : Calendar.shiftDate(mahadashaStart, elapsedAntardashaYears, 1);
        const period = AntarDasha.make({
          mahadasha,
          antardasha,
          start: antardashaStart,
          end: antardashaEnd,
        });
        antardashaStart = antardashaEnd;
        return period;
      });
      const period = MahaDasha.make({
        mahadasha,
        start: mahadashaStart,
        end: mahadashaEnd,
        antardashas,
      });
      mahadashaStart = mahadashaEnd;
      return period;
    });
  },
  Effect.mapError((cause) =>
    DashaCalculationError.make({
      message: "Could not calculate Vimshottari Dasha",
      cause,
    }),
  ),
);
