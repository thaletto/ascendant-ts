import { Context, Effect, Layer, Schema } from "effect";
import { Degree, type Longitude, type Placements } from "./chart/model.js";

export const ClassicalPlanets = Schema.Literals([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
] as const);
export type ClassicalPlanet = typeof ClassicalPlanets.Type;

export const Roles = Schema.Literals([
  "Atmakaraka",
  "Amatyakaraka",
  "Bhratrikaraka",
  "Matrikaraka",
  "Putrakaraka",
  "Gnatikaraka",
  "Darakaraka",
] as const);
export type Role = typeof Roles.Type;

export const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("exact-degree-shared-roles"),
  version: Schema.Literal(1),
});
export interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

export const Holder = Schema.Struct({
  planet: ClassicalPlanets,
  degree: Degree,
});
export interface Holder extends Schema.Schema.Type<typeof Holder> {}

export const Assignments = Schema.Record(Roles, Schema.NonEmptyArray(Holder));
export interface Assignments extends Schema.Schema.Type<typeof Assignments> {}

export const Result = Schema.Struct({
  provenance: Provenance,
  assignments: Assignments,
});
export interface Result extends Schema.Schema.Type<typeof Result> {}

export class EvidenceError extends Schema.TaggedError<EvidenceError>()(
  "CharaKarakasEvidenceError",
  {
    placement: ClassicalPlanets,
    expected: Schema.Literal(1),
    actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  },
) {}

const CLASSICAL_PLANET_ORDER = ClassicalPlanets.literals;
const ROLE_ORDER = Roles.literals;

interface RankedHolder extends Holder {
  readonly exactDegree: ExactDegree;
}

interface ExactDegree {
  readonly coefficient: bigint;
  readonly scale: number;
  readonly value: Degree;
}

function powerOfTen(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

function exactDegreeOf(longitude: Longitude): ExactDegree {
  const [mantissa, exponentText] = longitude.toString().toLowerCase().split("e");
  if (mantissa === undefined) throw new Error(`Could not represent longitude ${longitude}`);
  const [whole, fraction = ""] = mantissa.split(".");
  if (whole === undefined) throw new Error(`Could not parse longitude ${longitude}`);

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
}

function compareExactDegrees(left: ExactDegree, right: ExactDegree): number {
  const commonScale = Math.max(left.scale, right.scale);
  const leftCoefficient = left.coefficient * powerOfTen(commonScale - left.scale);
  const rightCoefficient = right.coefficient * powerOfTen(commonScale - right.scale);
  return leftCoefficient < rightCoefficient ? -1 : leftCoefficient > rightCoefficient ? 1 : 0;
}

function hasSameDegree(left: RankedHolder, right: RankedHolder): boolean {
  return compareExactDegrees(left.exactDegree, right.exactDegree) === 0;
}

function assignmentAt(assignments: ReadonlyMap<Role, readonly [Holder, ...Holder[]]>, role: Role) {
  const assignment = assignments.get(role);
  if (assignment === undefined) {
    throw new Error(`Missing Chara Karaka assignment for ${role}`);
  }
  return assignment;
}

export const calculate = Effect.fn("CharaKarakas.calculate")(function* (placements: Placements) {
  const holders: RankedHolder[] = [];
  for (const planet of CLASSICAL_PLANET_ORDER) {
    const matches = placements.planets.filter((placement) => placement.name === planet);
    const match = matches[0];
    if (matches.length !== 1 || match === undefined) {
      return yield* new EvidenceError({
        placement: planet,
        expected: 1,
        actual: matches.length,
      });
    }
    const exactDegree = exactDegreeOf(match.longitude);
    holders.push({ planet, degree: exactDegree.value, exactDegree });
  }

  holders.sort(
    (left, right) =>
      compareExactDegrees(right.exactDegree, left.exactDegree) ||
      CLASSICAL_PLANET_ORDER.indexOf(left.planet) - CLASSICAL_PLANET_ORDER.indexOf(right.planet),
  );

  const byRole = new Map<Role, readonly [Holder, ...Holder[]]>();
  let rank = 0;
  while (rank < holders.length) {
    const first = holders[rank];
    if (first === undefined) throw new Error(`Missing Chara Karaka holder at rank ${rank}`);

    let nextRank = rank + 1;
    while (true) {
      const candidate = holders[nextRank];
      if (candidate === undefined || !hasSameDegree(candidate, first)) break;
      nextRank += 1;
    }
    const tiedRanks = holders.slice(rank, nextRank);
    const canonicalDegree = first.exactDegree.value;
    const tiedHolders = tiedRanks.map((holder): Holder => ({
      planet: holder.planet,
      degree: canonicalDegree,
    }));
    const firstTiedHolder = tiedHolders[0];
    if (firstTiedHolder === undefined) throw new Error(`Missing tied holder at rank ${rank}`);
    const nonEmptyTiedHolders: readonly [Holder, ...Holder[]] = [
      firstTiedHolder,
      ...tiedHolders.slice(1),
    ];

    for (let roleIndex = rank; roleIndex < nextRank; roleIndex += 1) {
      const role = ROLE_ORDER[roleIndex];
      if (role === undefined) throw new Error(`Missing Chara Karaka role at rank ${roleIndex}`);
      byRole.set(role, nonEmptyTiedHolders);
    }
    rank = nextRank;
  }

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "exact-degree-shared-roles" as const,
      version: 1 as const,
    },
    assignments: {
      Atmakaraka: assignmentAt(byRole, "Atmakaraka"),
      Amatyakaraka: assignmentAt(byRole, "Amatyakaraka"),
      Bhratrikaraka: assignmentAt(byRole, "Bhratrikaraka"),
      Matrikaraka: assignmentAt(byRole, "Matrikaraka"),
      Putrakaraka: assignmentAt(byRole, "Putrakaraka"),
      Gnatikaraka: assignmentAt(byRole, "Gnatikaraka"),
      Darakaraka: assignmentAt(byRole, "Darakaraka"),
    },
  } satisfies Result;
});

export interface Service {
  readonly calculate: (placements: Placements) => Effect.Effect<Result, EvidenceError>;
}

export const Service = Context.Service<Service>("astro-ascendant/chara-karakas/Service");

export const layer = Layer.succeed(Service, Service.of({ calculate }));
