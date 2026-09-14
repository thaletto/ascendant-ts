import { BunRuntime } from "@effect/platform-bun";
import { Effect } from "effect";

import { runSelectedExample } from "./input";
import { runtimeLayer } from "./runtime";

const examples = runSelectedExample().pipe(Effect.provide(runtimeLayer));

BunRuntime.runMain(examples);
