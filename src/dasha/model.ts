import { Schema } from "effect";

import { Planets } from "../chart/model.js";

export const AntarDasha = Schema.Struct({
  mahadasha: Planets,
  antardasha: Planets,
  start: Schema.DateTimeUtc,
  end: Schema.DateTimeUtc,
});
export interface AntarDasha extends Schema.Schema.Type<typeof AntarDasha> {}

export const MahaDasha = Schema.Struct({
  mahadasha: Planets,
  start: Schema.DateTimeUtc,
  end: Schema.DateTimeUtc,
  antardashas: Schema.Array(AntarDasha),
});
export interface MahaDasha extends Schema.Schema.Type<typeof MahaDasha> {}

export const VimshottariDasha = Schema.Array(MahaDasha);
export type VimshottariDasha = typeof VimshottariDasha.Type;

export const CurrentDasha = Schema.Struct({
  mahadasha: MahaDasha,
  antardasha: AntarDasha,
});
export interface CurrentDasha extends Schema.Schema.Type<typeof CurrentDasha> {}
