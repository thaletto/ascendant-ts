import { DateTime } from "effect";

import { RASHIS } from "../chart/internal/constants.js";
import { signAt } from "../chart/internal/position.js";
import type { Rashis } from "../chart/model.js";
import { Calendar } from "./calendar.js";
import { RashiAntarDasha, RashiMahaDasha } from "./model.js";

export type Direction = 1 | -1;

export function rashiIndex(sign: Rashis): number {
  return RASHIS.indexOf(sign);
}

function sequenceFrom(startIndex: number, direction: Direction): readonly Rashis[] {
  return Array.from({ length: RASHIS.length }, (_, index) =>
    signAt(startIndex + index * direction),
  );
}

function makeRashiMahaDasha(
  mahadasha: Rashis,
  start: DateTime.Utc,
  years: number,
  antardashaSequence: readonly Rashis[],
): RashiMahaDasha {
  const end = Calendar.shiftDate(start, years, 1);
  let antardashaStart = start;
  const antardashas = antardashaSequence.map((antardasha, index) => {
    const antardashaEnd =
      index === antardashaSequence.length - 1
        ? end
        : DateTime.add(start, { months: years * (index + 1) });
    const period = RashiAntarDasha.make({
      mahadasha,
      antardasha,
      start: antardashaStart,
      end: antardashaEnd,
    });
    antardashaStart = antardashaEnd;
    return period;
  });

  return RashiMahaDasha.make({
    mahadasha,
    start,
    end,
    antardashas,
  });
}

export const RashiInternal = { makeRashiMahaDasha, sequenceFrom };
