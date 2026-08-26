import { Effect } from "effect";

import { getDivisionalTarget } from "../../chart/divisional-mapping/calculate.js";
import { Placements } from "../../chart/model.js";
import * as CharaKarakas from "../chara-karakas/index.js";
import { signOf } from "./helper.js";
import type { Result } from "./model.js";
import { CalculationError, EvidenceError, Provenance } from "./model.js";

export const calculate = Effect.fn("Karakamsha.calculate")(function* (placements: Placements) {
  const charaKarakas = yield* CharaKarakas.calculate(placements).pipe(
    Effect.mapError((error) => {
      if (error._tag === "CharaKarakasEvidenceError") {
        return EvidenceError.make({
          placement: error.placement,
          expected: 1,
          actual: error.actual,
        });
      }
      return CalculationError.make({
        message: "Chara Karaka calculation failed",
        cause: error,
      });
    }),
  );

  const karakamshaPlacements = yield* Effect.all(
    charaKarakas.assignments.Atmakaraka.map((holder) => {
      const source = placements.planets.find((planet) => planet.name === holder.planet);
      if (source === undefined) {
        return Effect.fail(
          EvidenceError.make({ placement: holder.planet, expected: 1, actual: 0 }),
        );
      }
      return getDivisionalTarget(source.longitude, 9).pipe(
        Effect.map((target) => ({
          planet: holder.planet,
          sign: signOf(target.signIndex),
        })),
        Effect.mapError((cause) =>
          CalculationError.make({
            message: `Could not calculate the D9 Sign for ${holder.planet}`,
            cause,
          }),
        ),
      );
    }),
    { concurrency: "unbounded" },
  );

  const first = karakamshaPlacements[0];
  if (first === undefined) throw new Error("Karakamsha requires at least one Atmakaraka");

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "atmakaraka-d9-sign" as const,
      version: 1 as const,
    } satisfies Provenance,
    placements: [first, ...karakamshaPlacements.slice(1)],
  } satisfies Result;
});
