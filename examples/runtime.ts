import { BunServices } from "@effect/platform-bun";
import { Layer } from "effect";

import * as Swisseph from "../src/swisseph/index.ts";

export const runtimeLayer = Layer.mergeAll(BunServices.layer, Swisseph.SwissephLayer);
