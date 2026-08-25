import { Context, Effect, Layer, Schema } from "effect";

import { RashiLords, Rashis, type Placements } from "../chart/model.js";
import * as ArudhaPada from "./arudha-pada.js";

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("twelfth-house-plain-projection"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  house: Schema.Literal(12),
  sourceSign: Rashis,
  lord: RashiLords,
  lordSign: Rashis,
  sign: Rashis,
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()("UpapadaEvidenceError", {
  placement: RashiLords,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

export const calculate = Effect.fn("Upapada.calculate")(function* (placements: Placements) {
  const arudhaPada = yield* ArudhaPada.calculate(placements, 12).pipe(
    Effect.mapError(
      (error) =>
        new EvidenceError({
          placement: error.placement,
          expected: 1,
          actual: error.actual,
        }),
    ),
  );

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "twelfth-house-plain-projection" as const,
      version: 1 as const,
    },
    house: 12 as const,
    sourceSign: arudhaPada.sourceSign,
    lord: arudhaPada.lord,
    lordSign: arudhaPada.lordSign,
    sign: arudhaPada.sign,
  } satisfies Result;
});

export interface Service {
  readonly calculate: (placements: Placements) => Effect.Effect<Result, EvidenceError>;
}

export const Service = Context.Service<Service>("astro-ascendant/upapada/Service");

export const layer = Layer.succeed(Service, Service.of({ calculate }));
