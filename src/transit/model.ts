import { Schema } from "effect";

import {
  ChartCalculation,
  Division,
  Houses,
  LocatedMoment,
  Longitude,
  Planets,
  Rashis,
} from "../chart/model.js";
import { TransitSearchProvenance } from "../provenance.js";

export const TransitKind = Schema.Literals([
  "sign-ingress",
  "cusp-crossing",
  "longitude-hit",
  "station",
]);
export type TransitKind = typeof TransitKind.Type;

export const TransitDirection = Schema.Literals(["forward", "backward"]);
export type TransitDirection = typeof TransitDirection.Type;

export class TransitEvent extends Schema.Class<TransitEvent>("TransitEvent")({
  planet: Planets,
  moment: Schema.DateTimeUtc,
  longitude: Longitude,
  kind: TransitKind,
  sign: Schema.optionalKey(Rashis),
  is_retrograde: Schema.Boolean,
  direction: TransitDirection,
  provenance: TransitSearchProvenance,
  calculation: Schema.optionalKey(ChartCalculation),
}) {}

export interface TransitRequest {
  readonly planet: typeof Planets.Type;
  readonly from: LocatedMoment;
  readonly count: number;
  readonly direction: typeof TransitDirection.Type;
  readonly kinds: ReadonlyArray<typeof TransitKind.Type>;
  readonly targetLongitude?: typeof Longitude.Type;
  readonly house?: typeof Houses.Type;
  readonly maxYears?: number;
  readonly precisionMinutes?: number;
  readonly includeCharts?: ReadonlyArray<typeof Division.Type>;
}

export { TransitSearchProvenance };
export type { ChartCalculation, Division, Houses, LocatedMoment, Longitude, Planets, Rashis };
