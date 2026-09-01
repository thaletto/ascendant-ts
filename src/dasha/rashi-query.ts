import { DateTime, Effect } from "effect";

import type { CurrentRashiDasha, RashiDasha } from "./model.js";

function contains(
  period: { readonly start: DateTime.Utc; readonly end: DateTime.Utc },
  instant: DateTime.Utc,
): boolean {
  return (
    period.start.epochMilliseconds <= instant.epochMilliseconds &&
    instant.epochMilliseconds < period.end.epochMilliseconds
  );
}

export const atRashi = Effect.fn("astro-ascendant/dasha/atRashi")(function* (
  timeline: RashiDasha,
  when?: DateTime.Utc,
) {
  const instant = when ?? (yield* DateTime.now);

  for (const mahadasha of timeline.mahadashas) {
    if (!contains(mahadasha, instant)) continue;
    for (const antardasha of mahadasha.antardashas) {
      if (contains(antardasha, instant)) {
        return {
          system: timeline.system,
          mahadasha,
          antardasha,
        } satisfies CurrentRashiDasha;
      }
    }
  }

  return null;
});
