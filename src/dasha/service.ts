import { Clock, Context, Effect, Layer } from "effect";
import type { Moment, Placements } from "../chart/model.js";
import { makeCalculate } from "./calculate.js";
import { DashaTimelineError, type DashaCalculationError } from "./error.js";
import type { AntarDasha, CurrentDasha, MahaDasha, VimshottariDasha } from "./model.js";
import { DashaTimeline } from "./timeline.js";

export interface Service {
  readonly calculate: (
    moment: Moment,
    placements: Placements,
  ) => Effect.Effect<VimshottariDasha, DashaCalculationError>;
  readonly current: (
    timeline: VimshottariDasha,
    when?: string | Date,
  ) => Effect.Effect<CurrentDasha, DashaTimelineError>;
  readonly mahadasha: (
    timeline: VimshottariDasha,
    offset?: number,
    when?: string | Date,
  ) => Effect.Effect<MahaDasha | null, DashaTimelineError>;
  readonly antardasha: (
    timeline: VimshottariDasha,
    offset?: number,
    when?: string | Date,
  ) => Effect.Effect<AntarDasha | null, DashaTimelineError>;
}

export const Service = Context.Service<Service>("astro-ascendant/dasha/Service");

const queryDate = Effect.fn("Dasha.queryDate")(function* (when: string | Date | undefined) {
  return when ?? new Date(yield* Clock.currentTimeMillis);
});

export const layer = Layer.succeed(
  Service,
  Service.of({
    calculate: makeCalculate(),
    current: Effect.fn("Dasha.current")(function* (timeline, when) {
      const target = yield* queryDate(when);
      return yield* Effect.try({
        try: () => new DashaTimeline(timeline).current(target),
        catch: (cause) => new DashaTimelineError({ operation: "current", cause }),
      });
    }),
    mahadasha: Effect.fn("Dasha.mahadasha")(function* (timeline, offset = 0, when) {
      const target = yield* queryDate(when);
      return yield* Effect.try({
        try: () => new DashaTimeline(timeline).mahadasha(offset, target),
        catch: (cause) => new DashaTimelineError({ operation: "mahadasha", cause }),
      });
    }),
    antardasha: Effect.fn("Dasha.antardasha")(function* (timeline, offset = 0, when) {
      const target = yield* queryDate(when);
      return yield* Effect.try({
        try: () => new DashaTimeline(timeline).antardasha(offset, target),
        catch: (cause) => new DashaTimelineError({ operation: "antardasha", cause }),
      });
    }),
  }),
);
