import { Schema } from "effect";

export const Ayanamsa = Schema.Literals(["Lahiri", "Raman"]);

export const HouseSystem = Schema.Literals(["Placidus", "WholeSign"]);

export class Options extends Schema.Class<Options>("AstroParams")({
  ayanamsa: Ayanamsa,
  houseSystem: HouseSystem,
}) {}
