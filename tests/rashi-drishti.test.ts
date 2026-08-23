import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import * as RashiDrishti from "../src/rashi-drishti.js";

describe("RashiDrishti.Service.calculate", () => {
  it.effect("returns the non-adjacent fixed Signs influenced by a movable Sign", () =>
    Effect.gen(function* () {
      const rashiDrishti = yield* RashiDrishti.Service;
      const result = yield* rashiDrishti.calculate("Aries");

      expect(result).toEqual({
        provenance: {
          school: "Jaimini",
          method: "movable-fixed-dual",
          version: 1,
        },
        reference: "Aries",
        targets: ["Leo", "Scorpio", "Aquarius"],
      });
    }).pipe(Effect.provide(RashiDrishti.layer)),
  );

  it.effect("returns the non-adjacent movable Signs influenced by a fixed Sign", () =>
    Effect.gen(function* () {
      const rashiDrishti = yield* RashiDrishti.Service;
      const result = yield* rashiDrishti.calculate("Taurus");

      expect(result.targets).toEqual(["Cancer", "Libra", "Capricorn"]);
    }).pipe(Effect.provide(RashiDrishti.layer)),
  );

  it.effect("returns the other dual Signs influenced by a dual Sign", () =>
    Effect.gen(function* () {
      const rashiDrishti = yield* RashiDrishti.Service;
      const result = yield* rashiDrishti.calculate("Pisces");

      expect(result.targets).toEqual(["Gemini", "Virgo", "Sagittarius"]);
    }).pipe(Effect.provide(RashiDrishti.layer)),
  );
});
