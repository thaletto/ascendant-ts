import { Context, Effect, Layer, Schema } from "effect";
import * as CharaKarakas from "./chara-karakas.js";
import { getDivisionalTarget } from "./chart/divisional-mapping.js";
import { RASHI_NAMES } from "./chart/literals.js";
import { Rashis, type Placements } from "./chart/model.js";

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("atmakaraka-d9-sign"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Placement = Schema.Struct({
  planet: CharaKarakas.ClassicalPlanets,
  sign: Rashis,
});
export interface Placement extends Schema.Schema.Type<typeof Placement> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  placements: Schema.NonEmptyArray(Placement),
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()("KarakamshaEvidenceError", {
  placement: CharaKarakas.ClassicalPlanets,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

export class CalculationError extends Schema.TaggedError<CalculationError>()(
  "KarakamshaCalculationError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}

export const calculate = Effect.fn("Karakamsha.calculate")(function* (placements: Placements) {
  const charaKarakas = yield* CharaKarakas.calculate(placements).pipe(
    Effect.mapError(
      (error) =>
        new EvidenceError({
          placement: error.placement,
          expected: 1,
          actual: error.actual,
        }),
    ),
  );

  const karakamshaPlacements = yield* Effect.all(
    charaKarakas.assignments.Atmakaraka.map((holder) => {
      const source = placements.planets.find((planet) => planet.name === holder.planet);
      if (source === undefined) {
        return Effect.fail(new EvidenceError({ placement: holder.planet, expected: 1, actual: 0 }));
      }
      return getDivisionalTarget(source.longitude, 9).pipe(
        Effect.map((target) => {
          const sign = RASHI_NAMES[target.signIndex];
          if (sign === undefined) throw new Error(`Missing D9 Sign at index ${target.signIndex}`);
          return { planet: holder.planet, sign };
        }),
        Effect.mapError(
          (cause) =>
            new CalculationError({
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
    },
    placements: [first, ...karakamshaPlacements.slice(1)],
  } satisfies Result;
});

export interface Service {
  readonly calculate: (
    placements: Placements,
  ) => Effect.Effect<Result, EvidenceError | CalculationError>;
}

export const Service = Context.Service<Service>("astro-ascendant/karakamsha/Service");

export const layer = Layer.succeed(Service, Service.of({ calculate }));
