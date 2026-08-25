import { Function } from "effect";

import { signAt } from "../../internal/helper.js";
import type { Planets, Rashis } from "../../internal/model.js";
import type { Relation } from "./model.js";
import { Positions } from "./model.js";

type PositionType = typeof Positions.Type;

export const relation = Function.dual<
  (
    position: PositionType,
    occupants: ReadonlyMap<Rashis, readonly Planets[]>,
    reverse: boolean,
  ) => (referenceIndex: number) => Relation,
  (
    referenceIndex: number,
    position: PositionType,
    occupants: ReadonlyMap<Rashis, readonly Planets[]>,
    reverse: boolean,
  ) => Relation
>(4, (referenceIndex, position, occupants, reverse) => {
  const offset = position - 1;
  const sign = signAt(referenceIndex + (reverse ? -offset : offset));
  const planets = occupants.get(sign);
  if (planets === undefined) throw new Error(`Missing occupants for ${sign}`);
  return { position, sign, planets };
});
