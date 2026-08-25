import { Context, Effect, Layer, Schema } from "effect";

import { RASHIS, SIGN_LORDS } from "../internal/constant.js";
import { signAt, signIndexOf } from "../internal/helper.js";
import { Houses, RashiLords, Rashis, type Placements } from "../internal/model.js";

const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("plain-projection"),
  version: Schema.Literal(1),
});
interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

const Result = Schema.Struct({
  provenance: Provenance,
  house: Houses,
  sourceSign: Rashis,
  lord: RashiLords,
  lordSign: Rashis,
  sign: Rashis,
});
interface Result extends Schema.Schema.Type<typeof Result> {}

class EvidenceError extends Schema.TaggedError<EvidenceError>()("ArudhaPadaEvidenceError", {
  placement: RashiLords,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

const calculate = Effect.fn("astro-ascendant/jaimini/arudha-pada/calculate")(function* (
  placements: Placements,
  house: Houses,
) {
  const lagnaSignIndex = signIndexOf(placements.lagna.longitude);
  const sourceSignIndex = (lagnaSignIndex + house - 1) % RASHIS.length;
  const sourceSign = signAt(sourceSignIndex);
  const lord = SIGN_LORDS[sourceSign];
  const matches = placements.planets.filter((planet) => planet.name === lord);
  const lordPlacement = matches[0];
  if (matches.length !== 1 || lordPlacement === undefined) {
    return yield* EvidenceError.make({
      placement: lord,
      expected: 1,
      actual: matches.length,
    });
  }

  const lordSignIndex = signIndexOf(lordPlacement.longitude);
  const distance = (lordSignIndex - sourceSignIndex + RASHIS.length) % RASHIS.length;

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

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (
      placements: Placements,
      house: Houses,
    ) => Effect.Effect<Result, EvidenceError>;
  }
>()("astro-ascendant/jaimini/arudha-pada/Service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as ArudhaPada, layer as ArudhaPadaLayer };
