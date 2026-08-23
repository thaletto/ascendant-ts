import { Context, Effect, Layer, Schema } from "effect";
import { PLANET_NAMES, RASHI_NAMES } from "../chart/literals.js";
import { Planets, Rashis, type Placements } from "../chart/model.js";
import { signAt, signIndexOf } from "../internal/sign-position.js";

export const SignReference = Schema.Struct({
  kind: Schema.Literal("Sign"),
  sign: Rashis,
});
export interface SignReference extends Schema.Schema.Type<typeof SignReference> {}

export const KetuReference = Schema.Struct({
  kind: Schema.Literal("Ketu"),
});
export interface KetuReference extends Schema.Schema.Type<typeof KetuReference> {}

export const Reference = Schema.Union([SignReference, KetuReference]);
export type Reference = typeof Reference.Type;

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("structural-positions"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Positions = Schema.Literals([2, 4, 11, 12, 10, 3, 5, 9] as const);

export const Relation = Schema.Struct({
  position: Positions,
  sign: Rashis,
  planets: Schema.Array(Planets),
});
export interface Relation extends Schema.Schema.Type<typeof Relation> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  reference: Reference,
  referenceSign: Rashis,
  direction: Schema.Literals(["forward", "reverse"] as const),
  supporting: Schema.Tuple([Relation, Relation, Relation]),
  obstructing: Schema.Tuple([Relation, Relation, Relation]),
  secondarySupporting: Relation,
  secondaryObstructing: Relation,
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()("ArgalaEvidenceError", {
  placement: Planets,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

function relation(
  referenceIndex: number,
  position: typeof Positions.Type,
  occupants: ReadonlyMap<typeof Rashis.Type, readonly (typeof Planets.Type)[]>,
  reverse: boolean,
): Relation {
  const offset = position - 1;
  const sign = signAt(referenceIndex + (reverse ? -offset : offset));
  const planets = occupants.get(sign);
  if (planets === undefined) throw new Error(`Missing occupants for ${sign}`);
  return { position, sign, planets };
}

export const calculate = Effect.fn("Argala.calculate")(function* (
  placements: Placements,
  reference: Reference,
) {
  const byPlanet = new Map<typeof Planets.Type, Placements["planets"][number]>();
  const occupants = new Map<typeof Rashis.Type, (typeof Planets.Type)[]>();
  for (const sign of RASHI_NAMES) occupants.set(sign, []);

  for (const planet of PLANET_NAMES) {
    const matches = placements.planets.filter((placement) => placement.name === planet);
    const match = matches[0];
    if (matches.length !== 1 || match === undefined) {
      return yield* new EvidenceError({
        placement: planet,
        expected: 1,
        actual: matches.length,
      });
    }
    byPlanet.set(planet, match);
    const sign = signAt(signIndexOf(match.longitude));
    const signOccupants = occupants.get(sign);
    if (signOccupants === undefined) throw new Error(`Missing occupants for ${sign}`);
    signOccupants.push(planet);
  }

  const reverse = reference.kind === "Ketu";
  const ketu = byPlanet.get("Ketu");
  if (ketu === undefined) throw new Error("Missing validated Ketu placement");
  const referenceSign =
    reference.kind === "Sign" ? reference.sign : signAt(signIndexOf(ketu.longitude));
  const referenceIndex = RASHI_NAMES.indexOf(referenceSign);

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "structural-positions" as const,
      version: 1 as const,
    },
    reference,
    referenceSign,
    direction: reverse ? ("reverse" as const) : ("forward" as const),
    supporting: [
      relation(referenceIndex, 2, occupants, reverse),
      relation(referenceIndex, 4, occupants, reverse),
      relation(referenceIndex, 11, occupants, reverse),
    ],
    obstructing: [
      relation(referenceIndex, 12, occupants, reverse),
      relation(referenceIndex, 10, occupants, reverse),
      relation(referenceIndex, 3, occupants, reverse),
    ],
    secondarySupporting: relation(referenceIndex, 5, occupants, reverse),
    secondaryObstructing: relation(referenceIndex, 9, occupants, reverse),
  } satisfies Result;
});

export interface Service {
  readonly calculate: (
    placements: Placements,
    reference: Reference,
  ) => Effect.Effect<Result, EvidenceError>;
}

export const Service = Context.Service<Service>("astro-ascendant/argala/Service");

export const layer = Layer.succeed(Service, Service.of({ calculate }));
