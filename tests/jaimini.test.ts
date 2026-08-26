import { describe, expect, it } from "@effect/vitest";
import { Effect, Equal, Layer } from "effect";

import * as Argala from "../src/jaimini/argala/index.js";
import * as ArudhaPada from "../src/jaimini/arudha-pada/index.js";
import * as CharaKarakas from "../src/jaimini/chara-karakas/index.js";
import * as Karakamsha from "../src/jaimini/karakamsha/index.js";
import * as RashiDrishti from "../src/jaimini/rashi-drishti/index.js";
import * as Upapada from "../src/jaimini/upapada/index.js";
import { fixtures } from "./support/fixtures.js";

const exactDegreePlacements = fixtures.placementsFromLongitudes({
  Sun: 10,
  Moon: 41,
  Mars: 72,
  Mercury: 103,
  Jupiter: 134,
  Venus: 165,
  Saturn: 196,
});

describe("named Jaimini calculations", () => {
  it.layer(CharaKarakas.CharaKarakasLayer)((it) => {
    it.effect("assigns Chara Karaka roles in exact descending degree order", () =>
      Effect.gen(function* () {
        const service = yield* CharaKarakas.CharaKarakas;
        const result = yield* service.calculate(exactDegreePlacements);

        expect(
          Equal.equals(result.provenance, {
            school: "Jaimini",
            method: "exact-degree-shared-roles",
            version: 1,
          }),
        ).toBe(true);
        expect(
          Equal.equals(result.assignments.Atmakaraka, [{ planet: "Saturn", degree: 16 }]),
        ).toBe(true);
        expect(Equal.equals(result.assignments.Darakaraka, [{ planet: "Sun", degree: 10 }])).toBe(
          true,
        );
      }),
    );

    it.effect("shares every role occupied by an exact tie", () =>
      Effect.gen(function* () {
        const service = yield* CharaKarakas.CharaKarakas;
        const result = yield* service.calculate(
          fixtures.placementsFromLongitudes({
            Sun: 10,
            Moon: 40,
            Mars: 70,
            Mercury: 100,
            Jupiter: 130,
            Venus: 165,
            Saturn: 195,
          }),
        );
        expect(
          Equal.equals(result.assignments.Atmakaraka, [
            { planet: "Venus", degree: 15 },
            { planet: "Saturn", degree: 15 },
          ]),
        ).toBe(true);
      }),
    );

    it.effect("reports missing evidence with a named calculation error", () =>
      Effect.gen(function* () {
        const service = yield* CharaKarakas.CharaKarakas;
        const exit = yield* Effect.exit(
          service.calculate(fixtures.placementsFromLongitudes({}, { omit: ["Moon"] })),
        );

        expect(exit._tag).toBe("Failure");
        if (exit._tag === "Failure")
          expect(String(exit.cause)).toContain("CharaKarakasEvidenceError");
      }),
    );
  });

  it.layer(Karakamsha.KarakamshaLayer)((it) => {
    it.effect("returns the D9 sign for each Atmakaraka", () =>
      Effect.gen(function* () {
        const service = yield* Karakamsha.Karakamsha;
        const result = yield* service.calculate(exactDegreePlacements);

        expect(result.provenance.method).toBe("atmakaraka-d9-sign");
        expect(result.placements).toHaveLength(1);
        expect(result.placements[0]?.planet).toBe("Saturn");
      }),
    );
  });

  it.layer(RashiDrishti.RashiDrishtiLayer)((it) => {
    it.effect("follows the movable, fixed, and dual Rashi Drishti rules", () =>
      Effect.gen(function* () {
        const service = yield* RashiDrishti.RashiDrishti;
        const result = yield* service.calculate("Aries");

        expect(
          Equal.equals(result, {
            provenance: { school: "Jaimini", method: "movable-fixed-dual", version: 1 },
            reference: "Aries",
            targets: ["Leo", "Scorpio", "Aquarius"],
          }),
        ).toBe(true);
      }),
    );
  });

  it.layer(Layer.merge(ArudhaPada.ArudhaPadaLayer, Upapada.UpapadaLayer))((it) => {
    it.effect("projects Arudha Pada and exposes Upapada as house twelve", () =>
      Effect.gen(function* () {
        const service = yield* ArudhaPada.ArudhaPada;
        const arudha = yield* service.calculate(exactDegreePlacements, 1);
        const upapadaService = yield* Upapada.Upapada;
        const upapada = yield* upapadaService.calculate(exactDegreePlacements);

        expect(arudha).toMatchObject({ house: 1, sourceSign: "Aries", lord: "Mars" });
        expect(upapada).toMatchObject({ house: 12, sourceSign: "Pisces", lord: "Jupiter" });
      }),
    );
  });

  it.layer(Argala.ArgalaLayer)((it) => {
    it.effect("returns Argala relations in forward and Ketu-reverse directions", () =>
      Effect.gen(function* () {
        const service = yield* Argala.Argala;
        const result = yield* service.calculate(exactDegreePlacements, { kind: "Ketu" });

        expect(result.direction).toBe("reverse");
        expect(result.supporting).toHaveLength(3);
        expect(result.obstructing).toHaveLength(3);
        expect(result.provenance.school).toBe("Jaimini");
      }),
    );
  });
});
