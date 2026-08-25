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

export const AshtakavargaEntities = Schema.Union([AshtakavargaPlanets, LagnaName]);

export const SignScores = Schema.Record(Rashis, Schema.Int);

export const BhinnaAshtakavarga = Schema.Record(AshtakavargaEntities, SignScores);

export const ReducedAshtakavarga = Schema.Record(AshtakavargaPlanets, SignScores);

export const Pinda = Schema.Struct({
  rashi_pinda: Schema.Int,
  graha_pinda: Schema.Int,
  shodhya_pinda: Schema.Int,
});

export const ShodhyaPinda = Schema.Record(AshtakavargaPlanets, Pinda);

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

export const AshtakavargaResult = Schema.Struct({
  bhinna: BhinnaAshtakavarga,
  sarva: SignScores,
  reduced: ReducedAshtakavarga,
  shodhya_pinda: ShodhyaPinda,
  totals: AshtakavargaTotals,
});
