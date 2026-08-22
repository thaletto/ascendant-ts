import { Schema } from "effect";
import { LagnaName, Rashis } from "../chart/model.js";

export const AshtakavargaPlanets = Schema.Literals([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
] as const);
export type AshtakavargaPlanet = typeof AshtakavargaPlanets.Type;

export const AshtakavargaEntities = Schema.Union([AshtakavargaPlanets, LagnaName]);
export type AshtakavargaEntity = typeof AshtakavargaEntities.Type;

export const SignScores = Schema.Record(Rashis, Schema.Int);
export interface SignScores extends Schema.Schema.Type<typeof SignScores> {}

export const BhinnaAshtakavarga = Schema.Record(AshtakavargaEntities, SignScores);
export interface BhinnaAshtakavarga extends Schema.Schema.Type<typeof BhinnaAshtakavarga> {}

export const ReducedAshtakavarga = Schema.Record(AshtakavargaPlanets, SignScores);
export interface ReducedAshtakavarga extends Schema.Schema.Type<typeof ReducedAshtakavarga> {}

export const Pinda = Schema.Struct({
  rashi_pinda: Schema.Int,
  graha_pinda: Schema.Int,
  shodhya_pinda: Schema.Int,
});
export interface Pinda extends Schema.Schema.Type<typeof Pinda> {}

export const ShodhyaPinda = Schema.Record(AshtakavargaPlanets, Pinda);
export interface ShodhyaPinda extends Schema.Schema.Type<typeof ShodhyaPinda> {}

export const AshtakavargaTotals = Schema.Struct({
  Sun: Schema.Int,
  Moon: Schema.Int,
  Mars: Schema.Int,
  Mercury: Schema.Int,
  Jupiter: Schema.Int,
  Venus: Schema.Int,
  Saturn: Schema.Int,
  Lagna: Schema.Int,
  sarva: Schema.Int,
});
export interface AshtakavargaTotals extends Schema.Schema.Type<typeof AshtakavargaTotals> {}

export const AshtakavargaResult = Schema.Struct({
  bhinna: BhinnaAshtakavarga,
  sarva: SignScores,
  reduced: ReducedAshtakavarga,
  shodhya_pinda: ShodhyaPinda,
  totals: AshtakavargaTotals,
});
export interface AshtakavargaResult extends Schema.Schema.Type<typeof AshtakavargaResult> {}
