import { Schema } from "effect";
import { Planets } from "../../chart/model.js";

export class AntarDasha extends Schema.Class<AntarDasha>("AntarDasha")({
  mahadasha: Planets,
  antardasha: Planets,
  start: Schema.String,
  end: Schema.String,
}) {}

export class MahaDasha extends Schema.Class<MahaDasha>("MahaDasha")({
  mahadasha: Planets,
  start: Schema.String,
  end: Schema.String,
  antardashas: Schema.Array(AntarDasha),
}) {}
