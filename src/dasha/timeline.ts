import type { AntarDasha, CurrentDasha, MahaDasha, VimshottariDasha } from "./model.js";

type Period = MahaDasha | AntarDasha;

function parseDate(value: string, message: string): Date {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (match === null) throw new Error(message);
  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(message);
  }
  return date;
}

function bounds(period: Period): readonly [Date, Date] {
  const start = parseDate(period.start, "timeline boundaries must use DD-MM-YYYY");
  const end = parseDate(period.end, "timeline boundaries must use DD-MM-YYYY");
  if (start > end) throw new Error("timeline period start must not follow end");
  return [start, end];
}

function normalizeDate(value: string | Date): Date {
  if (typeof value === "string") return parseDate(value, "date must use DD-MM-YYYY");
  if (!Number.isFinite(value.getTime())) throw new Error("date must be valid");
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function contains(period: Period, target: Date): boolean {
  const [start, end] = bounds(period);
  return start <= target && target <= end;
}

function indexContaining(periods: readonly Period[], target: Date): number | undefined {
  const index = periods.findIndex((period) => contains(period, target));
  return index === -1 ? undefined : index;
}

export class DashaTimeline {
  readonly timeline: VimshottariDasha;

  constructor(timeline: VimshottariDasha) {
    for (const period of timeline) {
      const [mahadashaStart, mahadashaEnd] = bounds(period);
      for (const antardasha of period.antardashas) {
        const [antardashaStart, antardashaEnd] = bounds(antardasha);
        if (antardashaStart < mahadashaStart || antardashaEnd > mahadashaEnd) {
          throw new Error("antardasha boundaries must be within mahadasha");
        }
      }
    }
    this.timeline = timeline;
  }

  current(when: string | Date): CurrentDasha {
    const target = normalizeDate(when);
    const mahadasha = this.timeline.find((period) => contains(period, target)) ?? null;
    const antardasha = mahadasha?.antardashas.find((period) => contains(period, target)) ?? null;
    return { mahadasha, antardasha };
  }

  mahadasha(offset: number, when: string | Date): MahaDasha | null {
    const currentIndex = indexContaining(this.timeline, normalizeDate(when));
    if (currentIndex === undefined) return null;
    return this.timeline[currentIndex + offset] ?? null;
  }

  antardasha(offset: number, when: string | Date): AntarDasha | null {
    const target = normalizeDate(when);
    const mahadasha = this.mahadasha(0, target);
    if (mahadasha === null) return null;
    const currentIndex = indexContaining(mahadasha.antardashas, target);
    if (currentIndex === undefined) return null;
    return mahadasha.antardashas[currentIndex + offset] ?? null;
  }
}
