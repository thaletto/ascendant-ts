import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";

import { selectInput } from "../examples/input";
import { runtimeLayer } from "../examples/runtime";
import { sublordBenchmark } from "./sublord";

const runBenchmarks = Effect.fn("Benchmarks.runBenchmark")(function* () {
  const input = yield* selectInput();
  yield* sublordBenchmark(input);
});

const benchmarks = runBenchmarks().pipe(Effect.provide(runtimeLayer));

BunRuntime.runMain(benchmarks);
