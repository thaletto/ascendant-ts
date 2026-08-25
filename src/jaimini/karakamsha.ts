import { Context, Effect, Layer, Schema } from "effect";

import { getDivisionalTarget } from "../chart/divisional-mapping/index.js";
import { RASHI_NAMES } from "../chart/literals.js";
import { Rashis, type Placements } from "../chart/model.js";
import * as CharaKarakas from "./chara-karakas.js";

const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("atmakaraka-d9-sign"),
  version: Schema.Literal(1),
});
interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

const Placement = Schema.Struct({
  planet: CharaKarakas.ClassicalPlanets,
  sign: Rashis,
});
interface Placement extends Schema.Schema.Type<typeof Placement> {}

const Result = Schema.Struct({
  provenance: Provenance,
  placements: Schema.NonEmptyArray(Placement),
});
interface Result extends Schema.Schema.Type<typeof Result> {}

class EvidenceError extends Schema.TaggedError<EvidenceError>()("KarakamshaEvidenceError", {
  placement: CharaKarakas.ClassicalPlanets,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

class CalculationError extends Schema.TaggedError<CalculationError>()(
  "KarakamshaCalculationError",
  {
    message: Schema.String,
    cause: Schema.Defect(),
  },
) {}

export const calculate = Effect.fn("Karakamsha.calculate")(function* (placements: Placements) {
  const charaKarakas = yield* CharaKarakas.calculate(placements).pipe(
    Effect.mapError((error) =>
      EvidenceError.make({
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
        return EvidenceError.make({ placement: holder.planet, expected: 1, actual: 0 });
      }
      return getDivisionalTarget(source.longitude, 9).pipe(
        Effect.map((target) => {
          const sign = RASHI_NAMES[target.signIndex];
          if (sign === undefined) throw new Error(`Missing D9 Sign at index ${target.signIndex}`);
          return { planet: holder.planet, sign };
        }),
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
    },
    placements: [first, ...karakamshaPlacements.slice(1)],
  } satisfies Result;
});

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (
      placements: Placements,
    ) => Effect.Effect<Result, EvidenceError | CalculationError>;
  }
>()("astro-ascendant/jaimini/karakamsha/Service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as Karakamsha, layer as KarakamshaLayer };
