import { Context, Effect, Layer, Schema } from "effect";

import { Degree, type Longitude, type Placements } from "../chart/model.js";

export const ClassicalPlanets = Schema.Literals([
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Jupiter",
  "Venus",
  "Saturn",
] as const);

const Roles = Schema.Literals([
  "Atmakaraka",
  "Amatyakaraka",
  "Bhratrikaraka",
  "Matrikaraka",
  "Putrakaraka",
  "Gnatikaraka",
  "Darakaraka",
] as const);
type Role = typeof Roles.Type;

const Provenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("exact-degree-shared-roles"),
  version: Schema.Literal(1),
});
interface Provenance extends Schema.Schema.Type<typeof Provenance> {}

const Holder = Schema.Struct({
  planet: ClassicalPlanets,
  degree: Degree,
});
interface Holder extends Schema.Schema.Type<typeof Holder> {}

const Assignments = Schema.Record(Roles, Schema.NonEmptyArray(Holder));
interface Assignments extends Schema.Schema.Type<typeof Assignments> {}

const Result = Schema.Struct({
  provenance: Provenance,
  assignments: Assignments,
});
interface Result extends Schema.Schema.Type<typeof Result> {}

class EvidenceError extends Schema.TaggedError<EvidenceError>()("CharaKarakasEvidenceError", {
  placement: ClassicalPlanets,
  expected: Schema.Literal(1),
  actual: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
}) {}

class ParseError extends Schema.TaggedError<ParseError>()("CharaKarakasParseError", {
  message: Schema.String,
}) {}

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

const exactDegreeOf = Effect.fn("exactDegreeOf")(function* (longitude: Longitude) {
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

function compareExactDegrees(left: ExactDegree, right: ExactDegree): number {
  const commonScale = Math.max(left.scale, right.scale);
  const leftCoefficient = left.coefficient * powerOfTen(commonScale - left.scale);
  const rightCoefficient = right.coefficient * powerOfTen(commonScale - right.scale);
  return leftCoefficient < rightCoefficient ? -1 : leftCoefficient > rightCoefficient ? 1 : 0;
}

function hasSameDegree(left: RankedHolder, right: RankedHolder): boolean {
  return compareExactDegrees(left.exactDegree, right.exactDegree) === 0;
}

const assignmentAt = Effect.fn(function* (
  assignments: ReadonlyMap<Role, readonly [Holder, ...Holder[]]>,
  role: Role,
) {
  const assignment = assignments.get(role);
  if (assignment === undefined) {
    return yield* EvidenceError.make({
      placement: "Sun" as const,
      expected: 1,
      actual: 0,
    });
  }
  return assignment;
});

export const calculate = Effect.fn("astro-ascendant/jaimini/chara-karakas/calculate")(function* (
  placements: Placements,
) {
  const holders: RankedHolder[] = [];
  for (const planet of CLASSICAL_PLANET_ORDER) {
    const matches = placements.planets.filter((placement) => placement.name === planet);
    const match = matches[0];
    if (matches.length !== 1 || match === undefined) {
      return yield* EvidenceError.make({
        placement: planet,
        expected: 1,
        actual: matches.length,
      });
    }
    const exactDegree = yield* exactDegreeOf(match.longitude);
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
    if (first === undefined) {
      return yield* ParseError.make({ message: `Missing Chara Karaka holder at rank ${rank}` });
    }

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
    if (firstTiedHolder === undefined) {
      return yield* ParseError.make({ message: `Missing tied holder at rank ${rank}` });
    }
    const nonEmptyTiedHolders: readonly [Holder, ...Holder[]] = [
      firstTiedHolder,
      ...tiedHolders.slice(1),
    ];

    for (let roleIndex = rank; roleIndex < nextRank; roleIndex += 1) {
      const role = ROLE_ORDER[roleIndex];
      if (role === undefined) {
        return yield* ParseError.make({
          message: `Missing Chara Karaka role at rank ${roleIndex}`,
        });
      }
      byRole.set(role, nonEmptyTiedHolders);
    }
    rank = nextRank;
  }

  const Atmakaraka = yield* assignmentAt(byRole, "Atmakaraka");
  const Amatyakaraka = yield* assignmentAt(byRole, "Amatyakaraka");
  const Bhratrikaraka = yield* assignmentAt(byRole, "Bhratrikaraka");
  const Matrikaraka = yield* assignmentAt(byRole, "Matrikaraka");
  const Putrakaraka = yield* assignmentAt(byRole, "Putrakaraka");
  const Gnatikaraka = yield* assignmentAt(byRole, "Gnatikaraka");
  const Darakaraka = yield* assignmentAt(byRole, "Darakaraka");

  return {
    provenance: {
      school: "Jaimini" as const,
      method: "exact-degree-shared-roles" as const,
      version: 1 as const,
    },
    assignments: {
      Atmakaraka,
      Amatyakaraka,
      Bhratrikaraka,
      Matrikaraka,
      Putrakaraka,
      Gnatikaraka,
      Darakaraka,
    },
  } satisfies Result;
});

class Service extends Context.Service<
  Service,
  {
    readonly calculate: (
      placements: Placements,
    ) => Effect.Effect<Result, EvidenceError | ParseError>;
  }
>()("astro-ascendant/jaimini/chara-karakas/Service") {}

const layer = Layer.succeed(Service, Service.of({ calculate }));

export { Service as CharaKarakas, layer as CharaKarakasLayer };
