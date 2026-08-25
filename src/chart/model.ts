import { Schema } from "effect";

import { Options as AstroParamsOptions } from "../astro-params/model.js";
import { NAKSHATRA_NAMES, PLANET_NAMES, RASHI_NAMES } from "./literals.js";

export const Planets = Schema.Literals(PLANET_NAMES);
export const Rashis = Schema.Literals(RASHI_NAMES);
export const LagnaName = Schema.Literal("Lagna");
export const PlanetsLagna = Schema.Union([Planets, LagnaName]);
export const Houses = Schema.Literals([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const);
export const RashiLords = Schema.Literals([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Venus",
  "Jupiter",
  "Saturn",
]);
export const Nakshatras = Schema.Literals(NAKSHATRA_NAMES);
export const Pada = Schema.Literals([1, 2, 3, 4] as const);
export const PlanetInSign = Schema.Literals([
  "Exalted",
  "Moola Trikona",
  "Own",
  "Friend",
  "Neutral",
  "Enemy",
  "Debilitated",
]);
export const Division = Schema.Literals([
  1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60,
] as const);

export const Longitude = Schema.Finite.check(
  Schema.isBetween({ minimum: 0, maximum: 360, exclusiveMaximum: true }),
).pipe(Schema.brand("Longitude"));
export type Longitude = typeof Longitude.Type;

export const CircleAngle = Schema.Finite.check(
  Schema.isBetween({ minimum: 0, maximum: 360, exclusiveMaximum: true }),
).pipe(Schema.brand("CircleAngle"));
export type CircleAngle = typeof CircleAngle.Type;

export const Degree = Schema.Finite.check(
  Schema.isBetween({ minimum: 0, maximum: 30, exclusiveMaximum: true }),
).pipe(Schema.brand("Degree"));
export type Degree = typeof Degree.Type;

export class Nakshatra extends Schema.Class<Nakshatra>("Nakshatra")({
  name: Nakshatras,
  lord: Planets,
  pada: Pada,
}) {}

export class Sign extends Schema.Class<Sign>("Sign")({
  name: Rashis,
  lord: RashiLords,
}) {}

export class Planet extends Schema.Class<Planet>("Planet")({
  name: Planets,
  longitude: Longitude,
  degree: Degree,
  is_retrograde: Schema.Boolean,
  in_sign: Schema.Array(PlanetInSign),
  sign: Sign,
}) {}

export class Lagna extends Schema.Class<Lagna>("Lagna")({
  name: LagnaName,
  longitude: Longitude,
  degree: Degree,
  sign: Sign,
}) {}

export class House extends Schema.Class<House>("House")({
  sign: Rashis,
  planets: Schema.Array(Planet),
  lagna: Schema.NullOr(Lagna),
}) {}

export const ChartHouses = Schema.Record(Houses, House);

export class SourcePlanet extends Schema.Class<SourcePlanet>("SourcePlanet")({
  name: Planets,
  longitude: Longitude,
  is_retrograde: Schema.Boolean,
  nakshatra: Nakshatra,
}) {}

export class SourceLagna extends Schema.Class<SourceLagna>("SourceLagna")({
  name: LagnaName,
  longitude: Longitude,
  nakshatra: Nakshatra,
}) {}

export class Placements extends Schema.Class<Placements>("Placements")({
  lagna: SourceLagna,
  planets: Schema.Array(SourcePlanet),
}) {}

export const Provenance = Schema.Struct({
  method: Schema.Literal("ascendant-divisional-mapping"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export class Chart extends Schema.Class<Chart>("Chart")({
  provenance: Provenance,
  division: Division,
  houses: ChartHouses,
}) {}

export class BhavaHouse extends Schema.Class<BhavaHouse>("BhavaHouse")({
  cusp: Longitude,
  planets: Schema.Array(Planet),
  lagna: Schema.NullOr(Lagna),
}) {}

export const BhavaHouses = Schema.Record(Houses, BhavaHouse);

export class BhavaAngles extends Schema.Class<BhavaAngles>("BhavaAngles")({
  ascendant: CircleAngle,
  mc: CircleAngle,
  armc: CircleAngle,
  vertex: CircleAngle,
  equatorialAscendant: CircleAngle,
  coAscendant1: CircleAngle,
  coAscendant2: CircleAngle,
  polarAscendant: CircleAngle,
}) {}

export class BhavaChart extends Schema.Class<BhavaChart>("BhavaChart")({
  houses: BhavaHouses,
  angles: BhavaAngles,
}) {}

export const CalculationCharts = Schema.NonEmptyArray(Chart).check(
  Schema.makeFilter((charts) => charts[0].division === 1, {
    expected: "a non-empty Chart collection beginning with D1",
  }),
);

export class ChartCalculation extends Schema.Class<ChartCalculation>("ChartCalculation")({
  placements: Placements,
  charts: CalculationCharts,
  bhava: BhavaChart,
  astroParams: AstroParamsOptions,
}) {}

export class Moment extends Schema.Class<Moment>("Moment")({
  date: Schema.DateTimeUtc,
}) {}

export class LocatedMoment extends Schema.Class<LocatedMoment>("LocatedMoment")({
  moment: Moment,
  latitude: Schema.Finite,
  longitude: Schema.Finite,
}) {}
