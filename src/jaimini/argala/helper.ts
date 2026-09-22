import { Effect, HashMap, Option } from "effect";

import { signAt } from "../../chart/internal/position.js";
import type { Planets, Rashis } from "../../chart/model.js";
import type { Relation } from "./model.js";
import { CalculationError, Positions } from "./model.js";

type PositionType = typeof Positions.Type;

export const relation = Effect.fn("Jaimini.argala.relation")(function* (
  referenceIndex: number,
  position: PositionType,
  occupants: HashMap.HashMap<Rashis, readonly Planets[]>,
  reverse: boolean,
) {
  const offset = position - 1;
  const sign = signAt(referenceIndex + (reverse ? -offset : offset));
  const planets = HashMap.get(occupants, sign);
  if (Option.isNone(planets)) {
    return yield* CalculationError.make({
      message: `Missing occupants for ${sign}`,
      cause: sign,
    });
  }
  return { position, sign, planets: planets.value } satisfies Relation;
});
