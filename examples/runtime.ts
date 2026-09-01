import { BunServices } from "@effect/platform-bun";
import { Layer } from "effect";
import { DevTools } from "effect/unstable/devtools";

import * as Swisseph from "../src/swisseph/index.ts";

export const runtimeLayer = Layer.mergeAll(
  BunServices.layer,
  Swisseph.SwissephLayer,
  DevTools.layer(),
);
