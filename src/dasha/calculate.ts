import { Effect, DateTime } from "effect";

import type { Moment, Placements, Planets } from "../chart/model.js";
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
] as const satisfies readonly (typeof Planets.Type)[];

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

interface CalendarDuration {
  readonly years: number;
  readonly months: number;
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
}

function calendarDuration(decimalYears: number): CalendarDuration {
  const years = Math.trunc(decimalYears);

  const monthsValue = (decimalYears - years) * 12;
  const months = Math.trunc(monthsValue);

  const daysValue = (monthsValue - months) * 30;
  const days = Math.trunc(daysValue);

  const hoursValue = (daysValue - days) * 24;
  const hours = Math.trunc(hoursValue);

  const minutes = Math.trunc((hoursValue - hours) * 60);
  return { years, months, days, hours, minutes };
}

function shiftDate(date: DateTime.Utc, decimalYears: number, direction: 1 | -1): DateTime.Utc {
  const duration = calendarDuration(decimalYears);
  const months = duration.years * 12 + duration.months;
  const shiftedMonth = DateTime.add(date, {
    months: direction * months,
  });
  return DateTime.add(shiftedMonth, {
    days: direction * duration.days,
    hours: direction * duration.hours,
    minutes: direction * duration.minutes,
  });
}

function formatDate(date: DateTime.Utc): string {
  const { year, month, day } = DateTime.toPartsUtc(date);
  return [String(day).padStart(2, "0"), String(month).padStart(2, "0"), String(year)].join("-");
}

function rotate<T>(values: readonly T[], start: number): readonly T[] {
  return [...values.slice(start), ...values.slice(0, start)];
}

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

    let mahadashaStart = shiftDate(moment.date, elapsedYears, -1);
    return sequence.map((mahadasha) => {
      const mahadashaYears = VIMSHOTTARI_YEARS[mahadasha];
      const mahadashaEnd = shiftDate(mahadashaStart, mahadashaYears, 1);
      const antardashaSequence = rotate(sequence, sequence.indexOf(mahadasha));
      let antardashaStart = mahadashaStart;
      let elapsedAntardashaYears = 0;

      const antardashas = antardashaSequence.map((antardasha, index) => {
        elapsedAntardashaYears +=
          (mahadashaYears * VIMSHOTTARI_YEARS[antardasha]) / VIMSHOTTARI_CYCLE_YEARS;
        const antardashaEnd =
          index === antardashaSequence.length - 1
            ? mahadashaEnd
            : shiftDate(mahadashaStart, elapsedAntardashaYears, 1);
        const period = AntarDasha.make({
          mahadasha,
          antardasha,
          start: formatDate(antardashaStart),
          end: formatDate(antardashaEnd),
        });
        antardashaStart = antardashaEnd;
        return period;
      });
      const period = MahaDasha.make({
        mahadasha,
        start: formatDate(mahadashaStart),
        end: formatDate(mahadashaEnd),
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
