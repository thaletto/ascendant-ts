import { Context, Effect, Layer, DateTime } from "effect";

import type { Moment, Placements } from "../internal/model.js";
import { calculate } from "./calculate.js";
import { DashaTimelineError, type DashaCalculationError } from "./error.js";
import type { AntarDasha, CurrentDasha, MahaDasha, VimshottariDasha } from "./model.js";

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (
      moment: Moment,
      placements: Placements,
    ) => Effect.Effect<VimshottariDasha, DashaCalculationError>;
    readonly current: (
      timeline: VimshottariDasha,
    ) => Effect.Effect<CurrentDasha | null, DashaTimelineError>;
    readonly mahadasha: (
      timeline: VimshottariDasha,
      offset?: number,
      when?: DateTime.Utc,
    ) => Effect.Effect<MahaDasha | null, DashaTimelineError>;
    readonly antardasha: (
      timeline: VimshottariDasha,
      offset?: number,
      when?: DateTime.Utc,
    ) => Effect.Effect<AntarDasha | null, DashaTimelineError>;
  }
>()("astro-ascendant/dasha/service") {}

const parseDate = Effect.fn(function* (value: string) {
  const [day, month, year] = value.split("-").map(Number);

  if (day === undefined || month === undefined || year === undefined) {
    return yield* DashaTimelineError.make({
      operation: "current",
      cause: value,
    });
  }

  return DateTime.makeUnsafe({
    year,
    month,
    day,
  });
});

const contains = Effect.fn(function* (period: { start: string; end: string }, when: DateTime.Utc) {
  const start = yield* parseDate(period.start);
  const end = yield* parseDate(period.end);
  return (
    start.epochMilliseconds <= when.epochMilliseconds &&
    when.epochMilliseconds < end.epochMilliseconds
  );
});

const resolveWhen = Effect.fn(function* (when?: DateTime.Utc) {
  if (when === undefined) {
    return yield* DateTime.now;
  }
  return when;
});

const current = Effect.fn("astro-ascendant/dasha/current")(
  function* (timeline: VimshottariDasha) {
    let currentMahadasha: MahaDasha | null = null;

    const now = yield* DateTime.now;

    for (const mahadasha of timeline) {
      const isCurrentMahadasha = yield* contains(
        {
          start: mahadasha.start,
          end: mahadasha.end,
        },
        now,
      );

      if (isCurrentMahadasha) {
        currentMahadasha = mahadasha;
        break;
      }
    }

    if (currentMahadasha === null) {
      return null;
    }

    for (const antardasha of currentMahadasha.antardashas) {
      const isCurrentAntardasha = yield* contains(
        {
          start: antardasha.start,
          end: antardasha.end,
        },
        now,
      );

      if (isCurrentAntardasha) {
        return {
          mahadasha: currentMahadasha,
          antardasha,
        } satisfies CurrentDasha;
      }
    }

    return null;
  },
  Effect.mapError((cause) =>
    DashaTimelineError.make({
      operation: "current",
      cause,
    }),
  ),
);

const mahadasha = Effect.fn("astro-ascendant/dasha/mahadasha")(
  function* (timeline: VimshottariDasha, offset = 0, when?: DateTime.Utc) {
    let index = -1;
    const at = yield* resolveWhen(when);
    for (let i = 0; i < timeline.length; i++) {
      if (yield* contains(timeline[i] as { start: string; end: string }, at)) {
        index = i;
        break;
      }
    }
    if (index === -1) return null;
    return timeline[index + offset] ?? null;
  },
  Effect.mapError((cause) => DashaTimelineError.make({ operation: "mahadasha", cause })),
);

const antardasha = Effect.fn("astro-ascendant/dasha/antardasha")(
  function* (timeline: VimshottariDasha, offset = 0, when?: DateTime.Utc) {
    const at = yield* resolveWhen(when);
    let mahadashaPeriod: MahaDasha | null = null;

    for (const mahadasha of timeline) {
      if (yield* contains(mahadasha as { start: string; end: string }, at)) {
        mahadashaPeriod = mahadasha;
        break;
      }
    }
    if (mahadashaPeriod === null) return null;

    let index = -1;
    for (let i = 0; i < mahadashaPeriod.antardashas.length; i++) {
      if (yield* contains(mahadashaPeriod.antardashas[i] as { start: string; end: string }, at)) {
        index = i;
        break;
      }
    }
    if (index === -1) return null;
    return mahadashaPeriod.antardashas[index + offset] ?? null;
  },
  Effect.mapError((cause) => DashaTimelineError.make({ operation: "antardasha", cause })),
);

const layer = Layer.succeed(
  Service,
  Service.of({
    calculate,
    current,
    mahadasha,
    antardasha,
  }),
);

export { Service as Dasha, layer as DashaLayer };
