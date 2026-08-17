import { Context, Effect, Layer } from "effect";
import * as Swisseph from "@swisseph/node";
import {
  Birth,
  Chart,
  House,
  HouseSystemName,
  Lagna,
  Planets,
  Planet,
  Rashis,
  Sign,
} from "../types";
import { inSignStatus, nakshatraOf, signOf, SIGN_LORDS } from "../const/tables";
import { Ephemeris } from "../ephemeris/service";
import { AstroParams } from "../config/astro-params";

const HOUSE_SYSTEM: Record<typeof HouseSystemName.Type, Swisseph.HouseSystem> = {
  Placidus: Swisseph.HouseSystem.Placidus,
  WholeSign: Swisseph.HouseSystem.WholeSign,
};

const BODY: Record<typeof Planets.Type, Swisseph.CelestialBody> = {
  Sun: Swisseph.Planet.Sun,
  Moon: Swisseph.Planet.Moon,
  Mars: Swisseph.Planet.Mars,
  Mercury: Swisseph.Planet.Mercury,
  Venus: Swisseph.Planet.Venus,
  Jupiter: Swisseph.Planet.Jupiter,
  Saturn: Swisseph.Planet.Saturn,
  Rahu: Swisseph.LunarPoint.TrueNode,
  Ketu: Swisseph.LunarPoint.TrueNode,
};

const normalize = (longitude: number): number => ((longitude % 360) + 360) % 360;

const houseIndexOf = (longitude: number, cusps: readonly number[]): number => {
  const ascendant = cusps[1]!;
  const position = normalize(longitude - ascendant);
  let house = 12;
  for (let i = 1; i <= 11; i++) {
    if (position < normalize(cusps[i + 1]! - ascendant)) {
      house = i;
      break;
    }
  }
  return house;
};

export class ChartService extends Context.Service<
  ChartService,
  {
    readonly generate: (birth: Birth) => Effect.Effect<typeof Chart.Type, unknown>;
  }
>()("@app/ChartService") {
  static readonly layer = Layer.effect(
    ChartService,
    Effect.gen(function* () {
      const ephemeris = yield* Ephemeris;
      const astroParams = yield* AstroParams;

      const generate = Effect.fn("ChartService.generate")((birth: Birth) =>
        Effect.gen(function* () {
          const julianDay = yield* ephemeris.dateToJulianDay(birth.moment.date);
          const houses = yield* ephemeris.calculateHouses(
            julianDay,
            birth.latitude,
            birth.longitude,
            HOUSE_SYSTEM[astroParams.houseSystem],
            astroParams.ayanamsa,
          );

          const ketuTrueNode = yield* ephemeris.calculatePosition(
            julianDay,
            Swisseph.LunarPoint.TrueNode,
            astroParams.ayanamsa,
          );

          const planetEntries = yield* Effect.all(
            (["Sun", "Moon", "Mars", "Mercury", "Venus", "Jupiter", "Saturn", "Rahu"] as const).map(
              (name) =>
                ephemeris
                  .calculatePosition(julianDay, BODY[name], astroParams.ayanamsa)
                  .pipe(Effect.map((position) => [name, position] as const)),
            ),
            { concurrency: "unbounded" },
          );

          const signOfCusp = (cusp: number): typeof Rashis.Type => signOf(cusp);

          const lagna = new Lagna({
            name: "Lagna",
            longitude: houses.ascendant,
            sign: new Sign({
              name: signOf(houses.ascendant),
              lord: SIGN_LORDS[signOf(houses.ascendant)],
              nakshatra: nakshatraOf(houses.ascendant),
            }),
          });

          const housePlanets: Record<number, Planet[]> = {};
          const addPlanet = (planet: Planet) => {
            const house = houseIndexOf(planet.longitude, houses.cusps);
            housePlanets[house] = [...(housePlanets[house] ?? []), planet];
          };

          for (const [name, position] of planetEntries) {
            addPlanet(
              new Planet({
                name,
                longitude: position.longitude,
                is_retrograde: position.longitudeSpeed < 0,
                in_sign: [...inSignStatus(name, signOf(position.longitude))],
                sign: new Sign({
                  name: signOf(position.longitude),
                  lord: SIGN_LORDS[signOf(position.longitude)],
                  nakshatra: nakshatraOf(position.longitude),
                }),
              }),
            );
          }

          const ketuLongitude = normalize(ketuTrueNode.longitude + 180);
          addPlanet(
            new Planet({
              name: "Ketu",
              longitude: ketuLongitude,
              is_retrograde: ketuTrueNode.longitudeSpeed < 0,
              in_sign: [...inSignStatus("Ketu", signOf(ketuLongitude))],
              sign: new Sign({
                name: signOf(ketuLongitude),
                lord: SIGN_LORDS[signOf(ketuLongitude)],
                nakshatra: nakshatraOf(ketuLongitude),
              }),
            }),
          );

          const chart = {} as Record<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12, House>;
          for (let i = 1; i <= 12; i++) {
            chart[i as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12] = new House({
              sign: signOfCusp(houses.cusps[i]!),
              planets: housePlanets[i] ?? [],
              lagna: i === 1 ? lagna : null,
            });
          }

          return Chart.make(chart);
        }),
      );

      return ChartService.of({ generate });
    }),
  );
}
