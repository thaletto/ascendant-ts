import { Data, Effect, Result } from "effect";
// @effect-diagnostics missingPipeableSignature:off

import { RASHIS } from "../chart/internal/constants.js";
import type {
  Division,
  Houses,
  PlanetDignity,
  Planets,
  PlanetsLagna,
  Rashis,
  RashiLords,
  Sex,
} from "../chart/model.js";
import { YogaStrategy, type EvaluationIndex } from "./internal.js";
import type { FormationEvidence } from "./model.js";

export interface HouseLord {
  readonly _tag: "HouseLord";
  readonly house: Houses;
  readonly reference: Subject;
  readonly division: Division;
}
export interface Dispositor {
  readonly _tag: "Dispositor";
  readonly subject: Subject;
  readonly division: Division;
}
export type Subject = PlanetsLagna | HouseLord | Dispositor;
export type Nature = "Movable" | "Fixed" | "Dual" | "Fire" | "Earth" | "Air" | "Water";
export type Phase = "Waxing" | "Waning" | "New" | "Full";
export type FormationCondition = Data.TaggedEnum<{
  Position: {
    readonly subject: Subject;
    readonly houses: readonly Houses[];
    readonly reference: Subject;
    readonly division: Division;
  };
  Dignity: {
    readonly subject: Subject;
    readonly dignities: readonly PlanetDignity[];
    readonly division: Division;
  };
  Signs: {
    readonly subject: Subject;
    readonly signs: readonly Rashis[];
    readonly division: Division;
  };
  Conjunction: { readonly subjects: readonly Subject[]; readonly division: Division };
  Aspect: { readonly from: Subject; readonly to: Subject; readonly division: Division };
  AspectHouse: {
    readonly from: Subject;
    readonly house: Houses;
    readonly reference: Subject;
    readonly division: Division;
  };
  Exchange: { readonly a: Subject; readonly b: Subject; readonly division: Division };
  Same: { readonly a: Subject; readonly b: Subject };
  Natural: { readonly subject: Subject; readonly group: "Benefic" | "Malefic" };
  Nature: { readonly subject: Subject; readonly nature: Nature; readonly division: Division };
  Parity: {
    readonly subject: Subject;
    readonly parity: "Odd" | "Even";
    readonly division: Division;
  };
  Sex: { readonly sex: Sex };
  DayNight: { readonly period: "Day" | "Night" };
  Phase: { readonly phase: Phase };
  Retrograde: { readonly subject: Subject };
  SignCount: {
    readonly subjects: readonly Subject[];
    readonly count: number;
    readonly division: Division;
  };
  Longitude: { readonly subject: Subject; readonly minimum: number; readonly maximum: number };
  All: { readonly children: readonly FormationCondition[] };
  Any: { readonly children: readonly FormationCondition[] };
  Not: { readonly child: FormationCondition };
  Unknown: { readonly reason: string };
}>;
export type Formation = FormationCondition;
const F = Data.taggedEnum<FormationCondition>();

/** Subject identification division is independent of the placement test division. */
export function lord(house: Houses, reference: Subject = "Lagna", division: Division = 1): Subject {
  return { _tag: "HouseLord", house, reference, division };
}
export function dispositor(subject: Subject, division: Division = 1): Subject {
  return { _tag: "Dispositor", subject, division };
}
export function pos(
  subject: Subject,
  houses: readonly Houses[],
  reference: Subject = "Lagna",
  division: Division = 1,
): Formation {
  return F.Position({ subject, houses, reference, division });
}
export function dignity(
  subject: Subject,
  dignities: readonly PlanetDignity[],
  division: Division = 1,
): Formation {
  return F.Dignity({ subject, dignities, division });
}
export function signs(
  subject: Subject,
  signs: readonly Rashis[],
  division: Division = 1,
): Formation {
  return F.Signs({ subject, signs, division });
}
export function conjunct(...subjects: readonly Subject[]): Formation {
  return conjunctIn(1, ...subjects);
}
export function conjunctIn(division: Division, ...subjects: readonly Subject[]): Formation {
  return F.Conjunction({ subjects, division });
}
export function aspect(from: Subject, to: Subject, division: Division = 1): Formation {
  return F.Aspect({ from, to, division });
}
export function aspectHouse(
  from: Subject,
  house: Houses,
  reference: Subject = "Lagna",
  division: Division = 1,
): Formation {
  return F.AspectHouse({ from, house, reference, division });
}
export function exchange(a: Subject, b: Subject, division: Division = 1): Formation {
  return F.Exchange({ a, b, division });
}
export function same(a: Subject, b: Subject): Formation {
  return F.Same({ a, b });
}
export function isBody(subject: Subject, body: PlanetsLagna): Formation {
  return same(subject, body);
}
/** Catalog convention: Mercury/Jupiter/Venus benefic, Sun/Mars/Saturn/nodes malefic.
 * Direct Moon queries use waxing/waning; exact syzygies remain unknown. */
export function natural(subject: Subject, group: "Benefic" | "Malefic"): Formation {
  return F.Natural({ subject, group });
}
export function signNature(subject: Subject, nature: Nature, division: Division = 1): Formation {
  return F.Nature({ subject, nature, division });
}
export function parity(
  subject: Subject,
  parity: "Odd" | "Even",
  division: Division = 1,
): Formation {
  return F.Parity({ subject, parity, division });
}
export function sex(sex: Sex): Formation {
  return F.Sex({ sex });
}
/** Geometric Sun-Lagna horizon; exact rising/setting is unknown. No civil-time proxy. */
export function dayNight(period: "Day" | "Night"): Formation {
  return F.DayNight({ period });
}
/** New and Full denote exact source-longitude syzygies, not a tithi or tolerance window. */
export function lunarPhase(phase: Phase): Formation {
  return F.Phase({ phase });
}
export function retrograde(subject: Subject): Formation {
  return F.Retrograde({ subject });
}
export function occupiedSignCount(
  subjects: readonly Subject[],
  count: number,
  division: Division = 1,
): Formation {
  return F.SignCount({ subjects, count, division });
}
/** Source sidereal longitude interval [minimum, maximum), without wrapping. */
export function longitude(subject: Subject, minimum: number, maximum: number): Formation {
  return F.Longitude({ subject, minimum, maximum });
}
export function all(...children: readonly Formation[]): Formation {
  return F.All({ children });
}
export function any(...children: readonly Formation[]): Formation {
  return F.Any({ children });
}
export function not(child: Formation): Formation {
  return F.Not({ child });
}
export function unknown(reason: string): Formation {
  return F.Unknown({ reason });
}
export function evaluator(condition: Formation): YogaStrategy {
  return YogaStrategy.Evaluator({
    name: "Formation",
    evaluate: (index) => evaluateFormation(condition, index),
  });
}

const lords: Record<Rashis, RashiLords> = {
  Aries: "Mars",
  Taurus: "Venus",
  Gemini: "Mercury",
  Cancer: "Moon",
  Leo: "Sun",
  Virgo: "Mercury",
  Libra: "Venus",
  Scorpio: "Mars",
  Sagittarius: "Jupiter",
  Capricorn: "Saturn",
  Aquarius: "Saturn",
  Pisces: "Jupiter",
};
function normalize(value: number, base: number): number {
  return ((value % base) + base) % base;
}
function evidence(
  operation: string,
  matched: boolean | null,
  observations: readonly string[] = [],
  reasons: readonly string[] = [],
  children: readonly FormationEvidence[] = [],
): FormationEvidence {
  return { _tag: "FormationEvidence", operation, matched, reasons, observations, children };
}
const readIndex = Effect.fn("Formation.readIndex")(function* <A>(read: () => A) {
  return yield* Effect.try({
    try: read,
    catch: (error) => (error instanceof Error ? error.message : String(error)),
  });
});
const divisionAt = Effect.fn("Formation.division")(function* (
  index: EvaluationIndex,
  division: Division,
) {
  const result = yield* readIndex(() => index.forDivision(division));
  if (Result.isFailure(result))
    return yield* Effect.fail(`D${division}: ${result.failure.message}`);
  return result.success;
});
const resolve = Effect.fn("Formation.resolve")(function* (
  subject: Subject,
  index: EvaluationIndex,
): Effect.fn.Return<PlanetsLagna, string> {
  if (typeof subject === "string") return subject;
  const at = yield* divisionAt(index, subject.division);
  if (subject._tag === "HouseLord") {
    const reference = yield* resolve(subject.reference, index);
    return lords[yield* readIndex(() => at.signAtRelativeHouse(reference, subject.house))];
  }
  const body = yield* resolve(subject.subject, index);
  return lords[yield* readIndex(() => at.signAtRelativeHouse(body, 1))];
});
const sign = Effect.fn("Formation.sign")(function* (
  subject: Subject,
  division: Division,
  index: EvaluationIndex,
) {
  const body = yield* resolve(subject, index);
  const at = yield* divisionAt(index, division);
  return yield* readIndex(() => at.signAtRelativeHouse(body, 1));
});
const sourceLongitude = Effect.fn("Formation.longitude")(function* (
  subject: Subject,
  index: EvaluationIndex,
) {
  const body = yield* resolve(subject, index);
  const placements = index.calculation?.placements;
  const value =
    body === "Lagna"
      ? placements?.lagna.longitude
      : placements?.planets.find((p) => p.name === body)?.longitude;
  if (value === undefined) return yield* Effect.fail(`Missing source longitude for ${body}`);
  return value;
});
const phaseAngle = Effect.fn("Formation.phaseAngle")(function* (index: EvaluationIndex) {
  return normalize(
    (yield* sourceLongitude("Moon", index)) - (yield* sourceLongitude("Sun", index)),
    360,
  );
});
const fullAspect = Effect.fn("Formation.fullAspect")(function* (
  from: Subject,
  targetSign: Rashis,
  division: Division,
  index: EvaluationIndex,
) {
  const body = yield* resolve(from, index);
  if (body === "Rahu" || body === "Ketu" || body === "Lagna")
    return yield* Effect.fail(`Full aspect rule undefined for ${body}`);
  const origin = yield* sign(body, division, index);
  const house = normalize(RASHIS.indexOf(targetSign) - RASHIS.indexOf(origin), 12) + 1;
  const extra: Partial<Record<Planets, readonly number[]>> = {
    Mars: [4, 8],
    Jupiter: [5, 9],
    Saturn: [3, 10],
  };
  return evidence("Aspect", house === 7 || (extra[body]?.includes(house) ?? false), [
    `${body} D${division} ${origin} -> ${targetSign}: relative house ${house}`,
  ]);
});

const evaluateNode = Effect.fn("Formation.evaluateNode")(function* (
  condition: Formation,
  index: EvaluationIndex,
): Effect.fn.Return<FormationEvidence, string> {
  return yield* F.$match(condition, {
    Unknown: ({ reason }) => Effect.succeed(evidence("Unknown", null, [], [reason])),
    All: ({ children }) => combine("All", children, index),
    Any: ({ children }) => combine("Any", children, index),
    Not: ({ child }) =>
      Effect.gen(function* () {
        const result = yield* evaluateFormation(child, index);
        return evidence(
          "Not",
          result.matched === null ? null : !result.matched,
          [],
          result.reasons,
          [result],
        );
      }),
    Position: (c) =>
      Effect.gen(function* () {
        const body = yield* resolve(c.subject, index);
        const reference = yield* resolve(c.reference, index);
        const at = yield* divisionAt(index, c.division);
        const house =
          normalize(yield* readIndex(() => at.positionOf(body) - at.positionOf(reference)), 12) + 1;
        return evidence(
          "Position",
          c.houses.some((h) => h === house),
          [
            `${body} D${c.division}: house ${house} from ${reference}; expected ${c.houses.join(",")}`,
          ],
        );
      }),
    Signs: (c) =>
      Effect.gen(function* () {
        const observed = yield* sign(c.subject, c.division, index);
        return evidence("Signs", c.signs.includes(observed), [
          `D${c.division} ${observed}; expected ${c.signs.join(",")}`,
        ]);
      }),
    Dignity: (c) =>
      Effect.gen(function* () {
        const body = yield* resolve(c.subject, index);
        if (body === "Lagna") return yield* Effect.fail("Dignity is undefined for Lagna");
        const at = yield* divisionAt(index, c.division);
        const observed = yield* readIndex(() => at.dignitiesOf(body));
        return evidence(
          "Dignity",
          observed.some((d) => c.dignities.includes(d)),
          [`${body} D${c.division}: ${observed.join(",")}; expected ${c.dignities.join(",")}`],
        );
      }),
    Conjunction: (c) =>
      Effect.gen(function* () {
        if (c.subjects.length < 2)
          return yield* Effect.fail("Conjunction requires at least two subjects");
        const observed = yield* Effect.all(c.subjects.map((s) => sign(s, c.division, index)));
        return evidence("Conjunction", new Set(observed).size === 1, [
          `D${c.division} sign conjunction: ${observed.join(",")}`,
        ]);
      }),
    Aspect: (c) =>
      Effect.gen(function* () {
        return yield* fullAspect(c.from, yield* sign(c.to, c.division, index), c.division, index);
      }),
    AspectHouse: (c) =>
      Effect.gen(function* () {
        const at = yield* divisionAt(index, c.division);
        const ref = yield* resolve(c.reference, index);
        return yield* fullAspect(
          c.from,
          yield* readIndex(() => at.signAtRelativeHouse(ref, c.house)),
          c.division,
          index,
        );
      }),
    Same: (c) =>
      Effect.gen(function* () {
        const a = yield* resolve(c.a, index);
        const b = yield* resolve(c.b, index);
        return evidence("Same", a === b, [`${a} = ${b}`]);
      }),
    Exchange: (c) =>
      Effect.gen(function* () {
        const a = yield* resolve(c.a, index);
        const b = yield* resolve(c.b, index);
        const sa = yield* sign(a, c.division, index);
        const sb = yield* sign(b, c.division, index);
        return evidence("Exchange", a !== b && lords[sa] === b && lords[sb] === a, [
          `${a} in ${sa}, ${b} in ${sb}, D${c.division}`,
        ]);
      }),
    Nature: (c) =>
      Effect.gen(function* () {
        const observed = yield* sign(c.subject, c.division, index);
        const n = RASHIS.indexOf(observed);
        const modalities = ["Movable", "Fixed", "Dual"];
        const elements = ["Fire", "Earth", "Air", "Water"];
        return evidence("Nature", modalities[n % 3] === c.nature || elements[n % 4] === c.nature, [
          `${observed}: ${modalities[n % 3]}, ${elements[n % 4]}`,
        ]);
      }),
    Parity: (c) =>
      Effect.gen(function* () {
        const observed = yield* sign(c.subject, c.division, index);
        const parity = RASHIS.indexOf(observed) % 2 === 0 ? "Odd" : "Even";
        return evidence("Parity", parity === c.parity, [`${observed}: ${parity}`]);
      }),
    Sex: (c) =>
      Effect.gen(function* () {
        const observed = index.calculation?.charts.find((chart) => chart.division === 1)?.sex;
        if (observed === undefined) return yield* Effect.fail("Birth sex not supplied");
        return evidence("Sex", observed === c.sex, [observed]);
      }),
    DayNight: (c) =>
      Effect.gen(function* () {
        const delta = normalize(
          (yield* sourceLongitude("Sun", index)) - (yield* sourceLongitude("Lagna", index)),
          360,
        );
        if (delta === 0 || delta === 180)
          return yield* Effect.fail("Sun on geometric rising/setting boundary");
        const period = delta > 180 ? "Day" : "Night";
        return evidence("DayNight", period === c.period, [
          `Geometric horizon: Sun minus Lagna ${delta} degrees; ${period}`,
        ]);
      }),
    Phase: (c) =>
      Effect.gen(function* () {
        const angle = yield* phaseAngle(index);
        const observed: Phase =
          angle === 0 ? "New" : angle === 180 ? "Full" : angle < 180 ? "Waxing" : "Waning";
        return evidence("Phase", observed === c.phase, [
          `Moon minus Sun ${angle} degrees: ${observed}; New/Full mean exact syzygy`,
        ]);
      }),
    Natural: (c) =>
      Effect.gen(function* () {
        const body = yield* resolve(c.subject, index);
        if (body === "Lagna") return yield* Effect.fail(`Natural group rule undefined for ${body}`);
        let benefic = body === "Mercury" || body === "Jupiter" || body === "Venus";
        if (body === "Moon") {
          const angle = yield* phaseAngle(index);
          if (angle === 0 || angle === 180)
            return yield* Effect.fail("Moon natural group at exact syzygy is undefined");
          benefic = angle < 180;
        }
        return evidence("Natural", c.group === "Benefic" ? benefic : !benefic, [
          `${body}: ${benefic ? "Benefic" : "Malefic"}; Moon uses waxing/waning rule`,
        ]);
      }),
    Retrograde: (c) =>
      Effect.gen(function* () {
        const body = yield* resolve(c.subject, index);
        const observed = index.calculation?.placements.planets.find((p) => p.name === body);
        if (observed === undefined)
          return yield* Effect.fail(`Missing retrograde evidence for ${body}`);
        return evidence("Retrograde", observed.is_retrograde, [
          `${body}: retrograde=${observed.is_retrograde}`,
        ]);
      }),
    SignCount: (c) =>
      Effect.gen(function* () {
        if (!Number.isInteger(c.count) || c.count < 0 || c.count > 12)
          return yield* Effect.fail("Occupied sign count must be an integer from 0 through 12");
        const observed = yield* Effect.all(c.subjects.map((s) => sign(s, c.division, index)));
        const count = new Set(observed).size;
        return evidence("SignCount", count === c.count, [
          `D${c.division}: ${observed.join(",")}; distinct=${count}; expected=${c.count}`,
        ]);
      }),
    Longitude: (c) =>
      Effect.gen(function* () {
        if (
          !Number.isFinite(c.minimum) ||
          !Number.isFinite(c.maximum) ||
          c.minimum < 0 ||
          c.maximum > 360 ||
          c.minimum >= c.maximum
        )
          return yield* Effect.fail(
            "Longitude interval must satisfy 0 <= minimum < maximum <= 360",
          );
        const value = yield* sourceLongitude(c.subject, index);
        return evidence("Longitude", value >= c.minimum && value < c.maximum, [
          `${value} in [${c.minimum},${c.maximum})`,
        ]);
      }),
  });
});
const combine = Effect.fn("Formation.combine")(function* (
  operation: "All" | "Any",
  conditions: readonly Formation[],
  index: EvaluationIndex,
): Effect.fn.Return<FormationEvidence> {
  const children = yield* Effect.all(conditions.map((c) => evaluateFormation(c, index)));
  const decisive = operation === "Any";
  const matched = children.some((c) => c.matched === decisive)
    ? decisive
    : children.some((c) => c.matched === null)
      ? null
      : !decisive;
  return evidence(
    operation,
    matched,
    [],
    children.flatMap((c) => c.reasons),
    children,
  );
});
/** Missing divisions/context and unresolved source judgements remain unknown, never false. */
export const evaluateFormation = Effect.fn("Yoga.evaluateFormation")(function* (
  condition: Formation,
  index: EvaluationIndex,
): Effect.fn.Return<FormationEvidence> {
  return yield* evaluateNode(condition, index).pipe(
    Effect.catch((reason) => Effect.succeed(evidence(condition._tag, null, [], [reason]))),
  );
});
