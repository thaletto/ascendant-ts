import { Function, HashMap, Option } from "effect";

import { signAt } from "../../chart/internal/position.js";
import type { Planets, Rashis } from "../../chart/model.js";
import type { Relation } from "./model.js";
import { Positions } from "./model.js";

type PositionType = typeof Positions.Type;

export const relation = Function.dual<
  (
    position: PositionType,
    occupants: HashMap.HashMap<Rashis, readonly Planets[]>,
    reverse: boolean,
  ) => (referenceIndex: number) => Relation,
  (
    referenceIndex: number,
    position: PositionType,
    occupants: HashMap.HashMap<Rashis, readonly Planets[]>,
    reverse: boolean,
  ) => Relation
>(4, (referenceIndex, position, occupants, reverse) => {
  const offset = position - 1;
  const sign = signAt(referenceIndex + (reverse ? -offset : offset));
  const planets = HashMap.get(occupants, sign);
  if (Option.isNone(planets)) throw new Error(`Missing occupants for ${sign}`);
  return { position, sign, planets: planets.value };
});
