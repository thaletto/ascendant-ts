import { Schema } from "effect";

import { RashiLords, Rashis } from "../../chart/model.js";

export class DeepExaltation extends Schema.Class<DeepExaltation>("DeepExaltation")({
  sign: Rashis,
  degree: Schema.Finite,
}) {}

export const DeepExaltationPoints = Schema.Record(RashiLords, DeepExaltation);
