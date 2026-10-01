import { BunRuntime } from "@effect/platform-bun";
import { Effect, Layer } from "effect";

import { runSelectedExample } from "./input.js";
import { runtimeLayer } from "./runtime.js";

const examples = Effect.scoped(
  Effect.flatMap(Layer.build(runtimeLayer), (context) =>
    Effect.provide(runSelectedExample, context),
  ),
);

BunRuntime.runMain(examples);
