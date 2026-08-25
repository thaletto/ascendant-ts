import { Effect, Function } from "effect";

import { Degree, Longitude } from "../../internal/model.js";
import type { Holder, ExactDegree, RankedHolder, Role } from "./model.js";
import { ClassicalPlanets, ParseError, Roles } from "./model.js";

export const CLASSICAL_PLANET_ORDER = ClassicalPlanets.literals;
export const ROLE_ORDER = Roles.literals;

export function powerOfTen(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

export const exactDegreeOf = Effect.fn("exactDegreeOf")(function* (longitude: Longitude) {
  const [mantissa, exponentText] = longitude.toString().toLowerCase().split("e");
  if (mantissa === undefined) {
    return yield* ParseError.make({ message: `Could not represent longitude ${longitude}` });
  }
  const [whole, fraction = ""] = mantissa.split(".");
  if (whole === undefined) {
    return yield* ParseError.make({ message: `Could not parse longitude ${longitude}` });
  }

  const exponent = exponentText === undefined ? 0 : Number.parseInt(exponentText, 10);
  let coefficient = BigInt(`${whole}${fraction}`);
  let scale = fraction.length - exponent;
  if (scale < 0) {
    coefficient *= powerOfTen(-scale);
    scale = 0;
  }

  coefficient %= 30n * powerOfTen(scale);
  while (scale > 0 && coefficient % 10n === 0n) {
    coefficient /= 10n;
    scale -= 1;
  }

  return {
    coefficient,
    scale,
    value: Degree.make(Number(`${coefficient.toString()}e-${scale}`)),
  };
});

export const compareExactDegrees = Function.dual<
  (right: ExactDegree) => (left: ExactDegree) => number,
  (left: ExactDegree, right: ExactDegree) => number
>(2, (left, right) => {
  const commonScale = Math.max(left.scale, right.scale);
  const leftCoefficient = left.coefficient * powerOfTen(commonScale - left.scale);
  const rightCoefficient = right.coefficient * powerOfTen(commonScale - right.scale);
  return leftCoefficient < rightCoefficient ? -1 : leftCoefficient > rightCoefficient ? 1 : 0;
});

export const hasSameDegree = Function.dual<
  (right: RankedHolder) => (left: RankedHolder) => boolean,
  (left: RankedHolder, right: RankedHolder) => boolean
>(2, (left, right) => compareExactDegrees(left.exactDegree, right.exactDegree) === 0);

export const assignmentAt = Effect.fn(function* (
  assignments: ReadonlyMap<Role, readonly [Holder, ...Holder[]]>,
  role: Role,
) {
  const assignment = assignments.get(role);
  if (assignment === undefined) {
    return yield* ParseError.make({ message: `Missing Chara Karaka role ${role}` });
  }
  return assignment;
});
