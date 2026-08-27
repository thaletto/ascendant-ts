import { Console, Effect } from "effect";

import { Chart, Yoga } from "../src/index.ts";
import type { ExampleInput } from "./input.ts";

const printYogas = Effect.fn("Examples.printYogas")(function* (evaluation: Yoga.YogaEvaluation) {
  yield* Console.log(`Yoga Catalog (${evaluation.results.length} rules evaluated)`);
  yield* Console.table(
    evaluation.results.map(({ yoga, present }) => ({
      ID: yoga.id,
      Name: yoga.name,
      Classification: yoga.classification,
      Present: present ? "Yes" : "No",
    })),
  );

  for (const { yoga, evidence } of evaluation.results) {
    // if (!present) continue;
    yield* Console.log(`${yoga.name}: ${Yoga.formatEvidence(evidence)}\n`);
  }
});

export const yogaExample = Effect.fn("Examples.yoga")(function* ({
  moment,
  latitude,
  longitude,
}: ExampleInput) {
  const calculation = yield* Chart.generate(
    Chart.LocatedMoment.make({ moment, latitude, longitude }),
  );

  yield* Yoga.evaluateAll(calculation).pipe(Effect.tap(printYogas));
});
