import { Effect } from "effect";
import type { Moment, Placements, Planets } from "../chart/model.js";
import { DashaCalculationError } from "./error.js";
import { AntarDasha, MahaDasha, type VimshottariDasha } from "./model.js";

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

function daysInUtcMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function shiftDate(date: Date, decimalYears: number, direction: 1 | -1): Date {
  const duration = calendarDuration(decimalYears);
  const totalMonths =
    date.getUTCFullYear() * 12 +
    date.getUTCMonth() +
    direction * (duration.years * 12 + duration.months);
  const year = Math.floor(totalMonths / 12);
  const month = ((totalMonths % 12) + 12) % 12;
  const day = Math.min(date.getUTCDate(), daysInUtcMonth(year, month));
  const shifted = new Date(
    Date.UTC(
      year,
      month,
      day,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
  shifted.setUTCDate(shifted.getUTCDate() + direction * duration.days);
  shifted.setUTCHours(shifted.getUTCHours() + direction * duration.hours);
  shifted.setUTCMinutes(shifted.getUTCMinutes() + direction * duration.minutes);
  return shifted;
}

function formatDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getUTCFullYear()}`;
}

function rotate<T>(values: readonly T[], start: number): readonly T[] {
  return [...values.slice(start), ...values.slice(0, start)];
}

function calculateTimeline(moment: Moment, placements: Placements): VimshottariDasha {
  if (!Number.isFinite(moment.date.getTime())) {
    throw new Error("Moment date must be valid");
  }

  const moon = placements.planets.find((planet) => planet.name === "Moon");
  if (moon === undefined) {
    throw new Error("Placements must contain the Moon");
  }

  const nakshatraLord = moon.nakshatra.lord;
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
}

export function makeCalculate() {
  return Effect.fn("Dasha.calculate")(function* (moment: Moment, placements: Placements) {
    return yield* Effect.try({
      try: () => calculateTimeline(moment, placements),
      catch: (cause) =>
        new DashaCalculationError({
          message: "Could not calculate Vimshottari Dasha",
          cause,
        }),
    });
  });
}
