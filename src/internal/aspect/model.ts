import { Schema } from "effect";
import { Houses, Planets } from "../../chart/model.js";

export class Aspect extends Schema.Class<Aspect>("Aspect")({
  planet: Planets,
  from_house: Houses,
  aspect_houses: Schema.Array(Schema.Record(Houses, Schema.Array(Planets))),
}) {}
