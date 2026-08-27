import { Console, DateTime, Effect } from "effect";

import { Chart, Dasha } from "../src/index.ts";
import type { ExampleInput } from "./input.ts";

const printDasha = Effect.fn("Examples.printDasha")(function* (timeline: Dasha.VimshottariDasha) {
  yield* Console.log("Vimshottari Mahadashas");
  yield* Console.table(
    timeline.map((period) => ({
      Mahadasha: period.mahadasha,
      Start: DateTime.formatIso(period.start),
      End: DateTime.formatIso(period.end),
    })),
  );

  for (const period of timeline) {
    yield* Console.log(
      `${period.mahadasha} Mahadasha Antardashas (${DateTime.formatIso(period.start)} to ${DateTime.formatIso(period.end)})`,
    );
    yield* Console.table(
      period.antardashas.map((antardasha) => ({
        Antardasha: antardasha.antardasha,
        Start: DateTime.formatIso(antardasha.start),
        End: DateTime.formatIso(antardasha.end),
      })),
    );
  }
});

export const dashaExample = Effect.fn("Examples.dasha")(function* ({
  moment,
  latitude,
  longitude,
}: ExampleInput) {
  const calculation = yield* Chart.generate(
    Chart.LocatedMoment.make({ moment, latitude, longitude }),
  );
  yield* Dasha.calculate(moment, calculation.placements).pipe(Effect.tap(printDasha));
});
