import { type HouseData, type PlanetaryPosition } from "../ephemeris/model.js";
import { type Planets } from "../internal/model.js";

export interface PlacementEvidence {
  readonly houses: HouseData;
  readonly planetEntries: readonly (readonly [Planets, PlanetaryPosition])[];
}
