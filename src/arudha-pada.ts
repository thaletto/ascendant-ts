import { Context, Effect, Layer, Schema } from "effect";
import { RASHI_NAMES } from "./chart/literals.js";
import { Houses, RashiLords, Rashis, type Placements } from "./chart/model.js";
import { SIGN_LORDS } from "./chart/tables.js";
import { signAt, signIndexOf } from "./internal/sign-position.js";

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("plain-projection"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  house: Houses,
  sourceSign: Rashis,
  lord: RashiLords,
  lordSign: Rashis,
  sign: Rashis,
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()("ArudhaPadaEvidenceError", {
  placement: RashiLords,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

export const calculate = Effect.fn("ArudhaPada.calculate")(function* (
  placements: Placements,
  house: typeof Houses.Type,
) {
  const lagnaSignIndex = signIndexOf(placements.lagna.longitude);
  const sourceSignIndex = (lagnaSignIndex + house - 1) % RASHI_NAMES.length;
  const sourceSign = signAt(sourceSignIndex);
  const lord = SIGN_LORDS[sourceSign];
  const matches = placements.planets.filter((planet) => planet.name === lord);
  const lordPlacement = matches[0];
  if (matches.length !== 1 || lordPlacement === undefined) {
    return yield* new EvidenceError({
      placement: lord,
      expected: 1,
      actual: matches.length,
    });
  }

  const lordSignIndex = signIndexOf(lordPlacement.longitude);
  const distance = (lordSignIndex - sourceSignIndex + RASHI_NAMES.length) % RASHI_NAMES.length;

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "plain-projection" as const,
      version: 1 as const,
    },
    house,
    sourceSign,
    lord,
    lordSign: signAt(lordSignIndex),
    sign: signAt(lordSignIndex + distance),
  } satisfies Result;
});

export interface Service {
  readonly calculate: (
    placements: Placements,
    house: typeof Houses.Type,
  ) => Effect.Effect<Result, EvidenceError>;
}

export const Service = Context.Service<Service>("astro-ascendant/arudha-pada/Service");

export const layer = Layer.succeed(Service, Service.of({ calculate }));
