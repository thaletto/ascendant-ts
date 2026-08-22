import { describe, expect, it } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Schema } from "effect";
import * as AstroParams from "../src/astro-params/index.js";

const EXPECTED_AYANAMSAS = [
  "FaganBradley",
  "Lahiri",
  "DeLuce",
  "Raman",
  "Ushashashi",
  "Krishnamurti",
  "DjwhalKhul",
  "Yukteshwar",
  "JNBhasin",
  "BabylKugler1",
  "BabylKugler2",
  "BabylKugler3",
  "BabylHuber",
  "BabylEtPSC",
  "Aldebaran15Tau",
  "Hipparchos",
  "Sassanian",
  "GalacticCenter0Sag",
  "J2000",
  "J1900",
  "B1950",
  "SuryaSiddhanta",
  "SuryaSiddhantaMeanSun",
  "Aryabhata",
  "AryabhataMeanSun",
  "SSRevati",
  "SSCitra",
  "TrueCitra",
  "TrueRevati",
  "TruePushya",
  "GalacticCenterGilBrand",
  "GalacticEquatorIAU1958",
  "GalacticEquator",
  "GalacticEquatorMidMula",
  "Skydram",
  "TrueMula",
  "DhruvaGalCenterMulaWilhelm",
  "Aryabhata522",
  "BabylBritton",
] as const;

const EXPECTED_HOUSE_SYSTEMS = [
  "Placidus",
  "Koch",
  "Porphyrius",
  "Regiomontanus",
  "Campanus",
  "Equal",
  "VehlowEqual",
  "WholeSign",
  "Meridian",
  "Azimuthal",
  "PolichPage",
  "Alcabitus",
  "Morinus",
] as const;

const ramanPlacidusLayer = AstroParams.layerConfig(AstroParams.environmentConfig).pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({ AYANAMSA: "Raman", HOUSE_SYSTEM: "Placidus" }),
    ),
  ),
);

const malformedLayer = AstroParams.layerConfig(AstroParams.environmentConfig).pipe(
  Layer.provide(
    ConfigProvider.layer(
      ConfigProvider.fromUnknown({ AYANAMSA: "Unknown", HOUSE_SYSTEM: "WholeSign" }),
    ),
  ),
);

describe("AstroParams layers", () => {
  it("supports the stable predefined ayanamsa and house-system vocabulary", () => {
    expect(AstroParams.Ayanamsa.literals).toEqual(EXPECTED_AYANAMSAS);
    expect(AstroParams.HouseSystem.literals).toEqual(EXPECTED_HOUSE_SYSTEMS);

    for (const ayanamsa of EXPECTED_AYANAMSAS) {
      expect(Schema.decodeSync(AstroParams.Ayanamsa)(ayanamsa)).toBe(ayanamsa);
    }
    for (const houseSystem of EXPECTED_HOUSE_SYSTEMS) {
      expect(Schema.decodeSync(AstroParams.HouseSystem)(houseSystem)).toBe(houseSystem);
    }
  });

  it("rejects unknown and UserDefined methodology values", () => {
    expect(() => Schema.decodeUnknownSync(AstroParams.Ayanamsa)("UserDefined")).toThrow();
    expect(() => Schema.decodeUnknownSync(AstroParams.Ayanamsa)("Unknown")).toThrow();
    expect(() => Schema.decodeUnknownSync(AstroParams.HouseSystem)("Unknown")).toThrow();
  });

  it.effect("provides explicit options", () =>
    Effect.gen(function* () {
      const params = yield* Effect.service(AstroParams.Service);
      expect(params).toEqual({ ayanamsa: "Raman", houseSystem: "Placidus" });
    }).pipe(Effect.provide(AstroParams.layer({ ayanamsa: "Raman", houseSystem: "Placidus" }))),
  );

  it.effect("provides Lahiri and WholeSign defaults", () =>
    Effect.gen(function* () {
      const params = yield* Effect.service(AstroParams.Service);
      expect(params).toEqual({ ayanamsa: "Lahiri", houseSystem: "WholeSign" });
    }).pipe(Effect.provide(AstroParams.defaultLayer)),
  );

  it.effect("decodes environment-backed configuration", () =>
    Effect.gen(function* () {
      const params = yield* Effect.service(AstroParams.Service);
      expect(params).toEqual({ ayanamsa: "Raman", houseSystem: "Placidus" });
    }).pipe(Effect.provide(ramanPlacidusLayer)),
  );

  it.effect("fails when environment-backed configuration is malformed", () =>
    Effect.service(AstroParams.Service).pipe(
      Effect.provide(malformedLayer),
      Effect.flip,
      Effect.map((error) => expect(error._tag).toBe("ConfigError")),
    ),
  );
});
