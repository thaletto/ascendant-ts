import { Function } from "effect";

import { RASHIS, SIGN_LORDS } from "../../internal/constant.js";
import { signAt } from "../../internal/helper.js";
import type { Rashis, RashiLords } from "../../internal/model.js";

export const sourceSignOf = Function.dual<
  (house: number) => (lagnaSignIndex: number) => Rashis,
  (lagnaSignIndex: number, house: number) => Rashis
>(2, (lagnaSignIndex, house) => signAt((lagnaSignIndex + house - 1) % RASHIS.length));

export const lordOfSign = (sign: Rashis): RashiLords => SIGN_LORDS[sign];

export const distanceBetween = Function.dual<
  (targetSignIndex: number) => (sourceSignIndex: number) => number,
  (sourceSignIndex: number, targetSignIndex: number) => number
>(
  2,
  (sourceSignIndex, targetSignIndex) =>
    (targetSignIndex - sourceSignIndex + RASHIS.length) % RASHIS.length,
);

export const projectedSign = Function.dual<
  (distance: number) => (lordSignIndex: number) => Rashis,
  (lordSignIndex: number, distance: number) => Rashis
>(2, (lordSignIndex, distance) => signAt(lordSignIndex + distance));
