import { DateTime, Effect } from "effect";

import type { CurrentDasha, VimshottariDasha } from "./model.js";

function contains(
  period: { readonly start: DateTime.Utc; readonly end: DateTime.Utc },
  instant: DateTime.Utc,
): boolean {
  return (
    period.start.epochMilliseconds <= instant.epochMilliseconds &&
    instant.epochMilliseconds < period.end.epochMilliseconds
  );
}

export const at = Effect.fn("astro-ascendant/dasha/at")(function* (
  timeline: VimshottariDasha,
  when?: DateTime.Utc,
) {
  const instant = when ?? (yield* DateTime.now);

  for (const mahadasha of timeline) {
    if (!contains(mahadasha, instant)) continue;

    for (const antardasha of mahadasha.antardashas) {
      if (contains(antardasha, instant)) {
        return { mahadasha, antardasha } satisfies CurrentDasha;
      }
    }
  }

  return null;
});
