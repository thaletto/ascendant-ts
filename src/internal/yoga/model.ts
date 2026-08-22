import { Schema } from "effect";

export class Yoga extends Schema.Class<Yoga>("Yoga")({
  id: Schema.String,
  name: Schema.String,
  present: Schema.Boolean,
  strength: Schema.Finite,
  details: Schema.String,
  type: Schema.Literals(["Positive", "Negative", "Neutral"]),
}) {}
