import type { Moment } from "../src/chart/index.ts";

export interface ExampleInput {
  readonly moment: Moment;
  readonly latitude: number;
  readonly longitude: number;
}
