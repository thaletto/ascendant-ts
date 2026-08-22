import { Schema } from "effect";
import { NAKSHATRA_NAMES, PLANET_NAMES, RASHI_NAMES } from "../const";

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

export class Chart extends Schema.Class<Chart>("Chart")({
  division: Division,
  houses: ChartHouses,
}) {}

export const CalculationCharts = Schema.NonEmptyArray(Chart).check(
  Schema.makeFilter((charts) => charts[0].division === 1, {
    expected: "a non-empty Chart collection beginning with D1",
  }),
);

export class ChartCalculation extends Schema.Class<ChartCalculation>("ChartCalculation")({
  placements: Placements,
  charts: CalculationCharts,
}) {}

export class ChartCalculationError extends Schema.TaggedError<ChartCalculationError>()(
  "ChartCalculationError",
  {
    stage: Schema.Literals(["validation", "placements", "mapping"]),
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}

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

export class Aspect extends Schema.Class<Aspect>("Aspect")({
  planet: Planets,
  from_house: Houses,
  aspect_houses: Schema.Array(Schema.Record(Houses, Schema.Array(Planets))),
}) {}

export class Yoga extends Schema.Class<Yoga>("Yoga")({
  id: Schema.String,
  name: Schema.String,
  present: Schema.Boolean,
  strength: Schema.Finite,
  details: Schema.String,
  type: Schema.Literals(["Positive", "Negative", "Neutral"]),
}) {}

export class DeepExaltation extends Schema.Class<DeepExaltation>("DeepExaltation")({
  sign: Rashis,
  degree: Schema.Finite,
}) {}

export const DeepExaltationPoints = Schema.Record(RashiLords, DeepExaltation);

export const JulianDay = Schema.Finite.check(Schema.isBetween({ minimum: 0, maximum: 1e7 })).pipe(
  Schema.brand("JulianDay"),
);

export type JulianDay = typeof JulianDay.Type;

export const Ayanamsa = Schema.Literals(["Lahiri", "Raman"]);

export const HouseSystemName = Schema.Literals(["Placidus", "WholeSign"]);

export class Moment extends Schema.Class<Moment>("Moment")({
  date: Schema.Date,
}) {}

const locatedMomentFields = {
  moment: Moment,
  latitude: Schema.Finite,
  longitude: Schema.Finite,
};

export class LocatedMoment extends Schema.Class<LocatedMoment>("LocatedMoment")(
  locatedMomentFields,
) {}

export class AstroParams extends Schema.Class<AstroParams>("AstroParams")({
  ayanamsa: Ayanamsa,
  houseSystem: HouseSystemName,
}) {}
