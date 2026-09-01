import { describe, expect, it } from "@effect/vitest";
import { Effect, Equal } from "effect";

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
  it.effect("assigns Chara Karaka roles in exact descending degree order", () =>
    Effect.gen(function* () {
      const result = yield* CharaKarakas.calculate(exactDegreePlacements);

      expect(
        Equal.equals(result.provenance, {
          school: "Jaimini",
          method: "exact-degree-shared-roles",
          version: 1,
        }),
      ).toBe(true);
      expect(Equal.equals(result.assignments.Atmakaraka, [{ planet: "Saturn", degree: 16 }])).toBe(
        true,
      );
      expect(Equal.equals(result.assignments.Darakaraka, [{ planet: "Sun", degree: 10 }])).toBe(
        true,
      );
    }),
  );

  it.effect("shares every role occupied by an exact tie", () =>
    Effect.gen(function* () {
      const result = yield* CharaKarakas.calculate(
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

  it.effect("reports missing Chara Karaka evidence through the typed failure channel", () =>
    Effect.gen(function* () {
      const exit = yield* Effect.exit(
        CharaKarakas.calculate(fixtures.placementsFromLongitudes({}, { omit: ["Moon"] })),
      );

      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure")
        expect(String(exit.cause)).toContain("CharaKarakasEvidenceError");
    }),
  );

  it.effect("returns the D9 sign for each Atmakaraka", () =>
    Effect.gen(function* () {
      const result = yield* Karakamsha.calculate(exactDegreePlacements);

      expect(result.placements[0]?.planet).toBe("Saturn");
    }),
  );

  it.effect("follows the movable, fixed, and dual Rashi Drishti rules", () =>
    Effect.gen(function* () {
      const result = yield* RashiDrishti.calculate("Aries");

      expect(
        Equal.equals(result, {
          provenance: { school: "Jaimini", method: "movable-fixed-dual", version: 1 },
          reference: "Aries",
          targets: ["Leo", "Scorpio", "Aquarius"],
        }),
      ).toBe(true);
    }),
  );

  it.effect("projects Arudha Pada and exposes Upapada as house twelve", () =>
    Effect.gen(function* () {
      const arudha = yield* ArudhaPada.calculate(exactDegreePlacements, 1);
      const upapada = yield* Upapada.calculate(exactDegreePlacements);

      expect(arudha.house).toBe(1);
      expect(arudha.sourceSign).toBe("Aries");
      expect(arudha.lord).toBe("Mars");
      expect(upapada.house).toBe(12);
      expect(upapada.sourceSign).toBe("Pisces");
      expect(upapada.lord).toBe("Jupiter");
    }),
  );

  it.effect("returns Argala relations in forward and Ketu-reverse directions", () =>
    Effect.gen(function* () {
      const result = yield* Argala.calculate(exactDegreePlacements, { kind: "Ketu" });

      expect(result.direction).toBe("reverse");
      expect(result.supporting).toHaveLength(3);
      expect(result.obstructing).toHaveLength(3);
    }),
  );
});
