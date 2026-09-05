import { CLASSICAL_PLANETS, PLANETS } from "../../chart/internal/constants.js";
import type { Houses, Planets } from "../../chart/model.js";
import {
  all,
  any,
  aspect,
  aspectHouse,
  conjunct,
  dignity,
  dispositor,
  isBody,
  lord,
  longitude,
  lunarPhase,
  natural,
  not,
  pos,
  retrograde,
  signs,
  signNature,
  unknown,
  type FormationCondition,
  type Subject,
} from "../formation.js";

const kendras = [1, 4, 7, 10] as const;
const anglesAndTrines = [1, 4, 5, 7, 9, 10] as const;

// Source: the supplied Astrotalk extraction, rows 245–300. No existing
// definition accurately covers these rows. Repeated names are alternate rules.
// Unknown clauses retain source ambiguity rather than substituting strength scores.
export const astrotalk245To300Skipped = [
  { row: 264, reason: "Whole source row mentions Mandi." },
  { row: 270, reason: "Whole source row mentions Mandi." },
  { row: 274, reason: "Whole source row mentions Mandi." },
  { row: 275, reason: "Whole source row mentions Mandi." },
] as const;

interface SourceRow {
  readonly row: number;
  readonly name: string;
  readonly classification: "Positive" | "Negative" | "Neutral";
  readonly description: string;
  readonly condition: FormationCondition;
}

function atLeast(count: number, conditions: readonly FormationCondition[]): FormationCondition {
  if (count === 0) return all();
  if (conditions.length < count) return any();
  const [first, ...rest] = conditions;
  if (first === undefined) return any();
  return any(all(first, atLeast(count - 1, rest)), atLeast(count, rest));
}

function occupiedByMalefic(houses: readonly Houses[]): FormationCondition {
  return any(...PLANETS.map((body) => all(natural(body, "Malefic"), pos(body, houses))));
}

function joinedOrAspectedByOther(
  subject: Subject,
  excluded: readonly Planets[] = [],
): FormationCondition {
  return any(
    ...PLANETS.filter((body) => !excluded.includes(body)).map((body) =>
      all(not(isBody(subject, body)), any(conjunct(body, subject), aspect(body, subject))),
    ),
  );
}

function afflictedByMalefic(subject: Subject): FormationCondition {
  return any(
    ...PLANETS.map((body) =>
      all(not(isBody(subject, body)), natural(body, "Malefic"), conjunct(body, subject)),
    ),
  );
}

function maleficNavamsa(subject: Subject): FormationCondition {
  return natural(dispositor(subject, 9), "Malefic");
}

// Exaltation lord of the sign of debility; Scorpio has no classical exalted graha.
const exaltedInDebilitySign = {
  Sun: "Saturn",
  Mars: "Jupiter",
  Mercury: "Venus",
  Jupiter: "Mars",
  Venus: "Mercury",
  Saturn: "Sun",
} as const;

function cancellation(body: (typeof CLASSICAL_PLANETS)[number]): FormationCondition {
  const signLord = dispositor(body);
  const lordInKendra = any(pos(signLord, kendras), pos(signLord, kendras, "Moon"));
  if (body === "Moon") return all(dignity(body, ["DEBILITATED"]), lordInKendra);
  const exaltationLord = exaltedInDebilitySign[body];
  return all(
    dignity(body, ["DEBILITATED"]),
    any(lordInKendra, pos(exaltationLord, kendras), pos(exaltationLord, kendras, "Moon")),
  );
}

export const astrotalk245To300: readonly SourceRow[] = [
  {
    row: 245,
    name: "Raja Yoga",
    classification: "Positive",
    description: "At least three classical planets occupy kendras with own or exalted dignity.",
    condition: atLeast(
      3,
      CLASSICAL_PLANETS.map((body) => all(pos(body, kendras), dignity(body, ["EXALTED", "OWN"]))),
    ),
  },
  {
    row: 246,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "A debilitated planet has bright rays or retrograde motion and favourable placement.",
    condition: any(
      ...CLASSICAL_PLANETS.map((body) =>
        all(
          dignity(body, ["DEBILITATED"]),
          any(retrograde(body), unknown("Bright rays have no defined measurement in row 246.")),
          unknown("Favourable positions are unspecified in row 246."),
        ),
      ),
    ),
  },
  {
    row: 247,
    name: "Raja Yoga",
    classification: "Positive",
    description: "Two to four planets possess directional strength.",
    condition: unknown("Row 247 does not specify the Digbala threshold for possessing strength."),
  },
  {
    row: 248,
    name: "Raja Yoga",
    classification: "Positive",
    description: "Aquarius rises with Venus; four planets are exalted without evil subdivisions.",
    condition: all(
      signs("Lagna", ["Aquarius"]),
      pos("Venus", [1]),
      atLeast(
        4,
        CLASSICAL_PLANETS.map((body) => dignity(body, ["EXALTED"])),
      ),
      not(
        atLeast(
          5,
          CLASSICAL_PLANETS.map((body) => dignity(body, ["EXALTED"])),
        ),
      ),
      unknown("Row 248 does not define evil navamsas or shashtiamsas."),
    ),
  },
  {
    row: 249,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Moon, Jupiter and Venus occupy the first, fourth and tenth; Saturn has own or exalted dignity.",
    condition: all(
      pos("Moon", [1]),
      pos("Jupiter", [4]),
      pos("Venus", [10]),
      dignity("Saturn", ["EXALTED", "OWN"]),
    ),
  },
  {
    row: 250,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "A debilitated planet's sign lord or exaltation lord occupies a kendra from Moon or Lagna.",
    condition: any(...CLASSICAL_PLANETS.map((body) => cancellation(body))),
  },
  {
    row: 251,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Moon occupies a non-ascendant kendra and receives Jupiter's or a powerful planet's aspect.",
    condition: all(
      pos("Moon", [4, 7, 10]),
      any(
        aspect("Jupiter", "Moon"),
        any(
          ...PLANETS.filter((body) => body !== "Moon" && body !== "Jupiter").map((body) =>
            all(
              aspect(body, "Moon"),
              unknown("Powerful planet has no defined threshold in row 251."),
            ),
          ),
        ),
      ),
    ),
  },
  {
    row: 252,
    name: "Raja Yoga",
    classification: "Positive",
    description: "A planet is debilitated in D1 and exalted in D9.",
    condition: any(
      ...CLASSICAL_PLANETS.map((body) =>
        all(dignity(body, ["DEBILITATED"]), dignity(body, ["EXALTED"], 9)),
      ),
    ),
  },
  {
    row: 253,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Jupiter in Lagna and Mercury in a kendra receive the ninth and eleventh lords' respective aspects.",
    condition: all(
      pos("Jupiter", [1]),
      pos("Mercury", kendras),
      aspect(lord(9), "Jupiter"),
      aspect(lord(11), "Mercury"),
    ),
  },
  {
    row: 254,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Saturn has exalted or moolatrikona dignity in an angle or trine under the tenth lord's aspect.",
    condition: all(
      dignity("Saturn", ["EXALTED", "MOOLA_TRIKONA"]),
      pos("Saturn", anglesAndTrines),
      aspect(lord(10), "Saturn"),
    ),
  },
  {
    row: 255,
    name: "Raja Yoga",
    classification: "Positive",
    description: "Moon and Mars conjoin in the second or third, with Rahu in the fifth.",
    condition: all(conjunct("Moon", "Mars"), pos("Moon", [2, 3]), pos("Rahu", [5])),
  },
  {
    row: 256,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "The tenth lord occupies the ninth with exalted or friendly navamsa and Uttamamsa.",
    condition: all(
      pos(lord(10), [9]),
      dignity(lord(10), ["EXALTED", "FRIEND"], 9),
      unknown("Uttamamsa criteria are unspecified in row 256."),
    ),
  },
  {
    row: 257,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "A fixed Lagna has its lord in the tenth; Jupiter occupies the fifth and a Moon kendra.",
    condition: all(
      signNature("Lagna", "Fixed"),
      pos(lord(1), [10]),
      pos("Jupiter", [5]),
      pos("Jupiter", kendras, "Moon"),
    ),
  },
  {
    row: 258,
    name: "Raja Yoga",
    classification: "Positive",
    description: "Moon's navamsa lord occupies an angle or trine from Lagna or Mercury.",
    condition: any(
      pos(dispositor("Moon", 9), anglesAndTrines),
      pos(dispositor("Moon", 9), anglesAndTrines, "Mercury"),
    ),
  },
  {
    row: 259,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Taurus rises with Moon; Saturn, Sun and Jupiter occupy the tenth, fourth and seventh.",
    condition: all(
      signs("Lagna", ["Taurus"]),
      pos("Moon", [1]),
      pos("Saturn", [10]),
      pos("Sun", [4]),
      pos("Jupiter", [7]),
    ),
  },
  {
    row: 260,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Lagna and its lord are movable; a debilitated planet's navamsa lord occupies an angle or trine.",
    condition: all(
      signNature("Lagna", "Movable"),
      signNature(lord(1), "Movable"),
      any(
        ...CLASSICAL_PLANETS.map((body) =>
          all(dignity(body, ["DEBILITATED"]), pos(dispositor(body, 9), anglesAndTrines)),
        ),
      ),
    ),
  },
  {
    row: 261,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Lagna lord joins a debilitated planet; Rahu and Saturn occupy the tenth under the ninth lord's aspect.",
    condition: all(
      any(
        ...CLASSICAL_PLANETS.map((body) =>
          all(not(isBody(lord(1), body)), dignity(body, ["DEBILITATED"]), conjunct(lord(1), body)),
        ),
      ),
      pos("Rahu", [10]),
      pos("Saturn", [10]),
      aspect(lord(9), "Rahu"),
      aspect(lord(9), "Saturn"),
    ),
  },
  {
    row: 262,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "An eleventh, ninth or second lord occupies a Moon kendra; Jupiter owns the second, fifth or eleventh.",
    condition: all(
      any(...([11, 9, 2] as const).map((house) => pos(lord(house), kendras, "Moon"))),
      any(...([2, 5, 11] as const).map((house) => isBody(lord(house), "Jupiter"))),
    ),
  },
  {
    row: 263,
    name: "Raja Yoga",
    classification: "Positive",
    description:
      "Jupiter, Mercury, Venus or Moon occupies the ninth, uncombust and connected with friendly planets.",
    condition: any(
      ...(["Jupiter", "Mercury", "Venus", "Moon"] as const).map((body) =>
        all(
          pos(body, [9]),
          joinedOrAspectedByOther(body),
          unknown("Row 263 specifies neither combustion orbs nor the friendship scheme."),
        ),
      ),
    ),
  },
  {
    row: 265,
    name: "Vrana Yoga",
    classification: "Negative",
    description: "A malefic sixth lord occupies the first, eighth or tenth.",
    condition: all(natural(lord(6), "Malefic"), pos(lord(6), [1, 8, 10])),
  },
  {
    row: 266,
    name: "Sisnavyadhi Yoga",
    classification: "Negative",
    description: "Mercury joins the sixth and eighth lords in Lagna.",
    condition: all(pos("Mercury", [1]), conjunct("Mercury", lord(6), lord(8))),
  },
  {
    row: 267,
    name: "Kalatrashanda Yoga",
    classification: "Negative",
    description: "The seventh lord conjoins Venus in the sixth.",
    condition: all(pos(lord(7), [6]), conjunct(lord(7), "Venus")),
  },
  {
    row: 268,
    name: "Kushtaroga Yoga",
    classification: "Negative",
    description: "The Lagna lord joins Mars and Mercury in the fourth or twelfth.",
    condition: all(pos(lord(1), [4, 12]), conjunct(lord(1), "Mars", "Mercury")),
  },
  {
    row: 269,
    name: "Kushtaroga Yoga",
    classification: "Negative",
    description: "Jupiter, Saturn and Moon conjoin in the sixth.",
    condition: all(pos("Jupiter", [6]), conjunct("Jupiter", "Saturn", "Moon")),
  },
  {
    row: 271,
    name: "Bandhana Yoga",
    classification: "Negative",
    description: "Lagna and sixth lords conjoin in an angle or trine with Saturn or a lunar node.",
    condition: all(
      pos(lord(1), anglesAndTrines),
      conjunct(lord(1), lord(6)),
      any(...(["Saturn", "Rahu", "Ketu"] as const).map((body) => conjunct(lord(1), body))),
    ),
  },
  {
    row: 272,
    name: "Karascheda Yoga",
    classification: "Negative",
    description: "Saturn occupies the ninth and Jupiter the third.",
    condition: all(pos("Saturn", [9]), pos("Jupiter", [3])),
  },
  {
    row: 273,
    name: "Sirachcheda Yoga",
    classification: "Negative",
    description:
      "The sixth lord joins Venus; Sun or Saturn joins Rahu with a cruel shashtiamsa requirement.",
    condition: all(
      conjunct(lord(6), "Venus"),
      any(conjunct("Sun", "Rahu"), conjunct("Saturn", "Rahu")),
      unknown("Row 273 does not identify the cruel shashtiamsas or their assignment rule."),
    ),
  },
  {
    row: 276,
    name: "Sanghataka Marana Yoga",
    classification: "Negative",
    description:
      "Numerous malefics occupy the eighth in Martian signs or navamsas and evil subdivisions.",
    condition: all(
      any(
        ...PLANETS.map((body) =>
          all(
            natural(body, "Malefic"),
            pos(body, [8]),
            any(signs(body, ["Aries", "Scorpio"]), signs(body, ["Aries", "Scorpio"], 9)),
          ),
        ),
      ),
      unknown("Row 276 leaves the required malefic count and evil subdivisions undefined."),
    ),
  },
  {
    row: 277,
    name: "Sanghataka Marana Yoga",
    classification: "Negative",
    description: "Sun, Rahu and Saturn receive the eighth lord's aspect and occupy evil amsas.",
    condition: all(
      ...(["Sun", "Rahu", "Saturn"] as const).map((body) => aspect(lord(8), body)),
      unknown("Evil amsas are not defined in row 277."),
    ),
  },
  {
    row: 278,
    name: "Peenasaroga Yoga",
    classification: "Negative",
    description:
      "Moon is in the sixth, Saturn in the eighth, and a malefic in the twelfth; Lagna lord has a malefic navamsa lord.",
    condition: all(
      pos("Moon", [6]),
      pos("Saturn", [8]),
      occupiedByMalefic([12]),
      maleficNavamsa(lord(1)),
    ),
  },
  {
    row: 279,
    name: "Pittaroga Yoga",
    classification: "Negative",
    description: "Sun occupies the sixth with a malefic and receives another malefic's aspect.",
    condition: all(
      pos("Sun", [6]),
      any(
        ...PLANETS.filter((body) => body !== "Sun").map((joined) =>
          all(
            natural(joined, "Malefic"),
            conjunct("Sun", joined),
            any(
              ...PLANETS.filter((body) => body !== "Sun" && body !== joined).map((body) =>
                all(natural(body, "Malefic"), aspect(body, "Sun")),
              ),
            ),
          ),
        ),
      ),
    ),
  },
  {
    row: 280,
    name: "Vikalangapatni Yoga",
    classification: "Negative",
    description: "Venus and Sun each occupy the fifth, seventh or ninth.",
    condition: all(pos("Venus", [5, 7, 9]), pos("Sun", [5, 7, 9])),
  },
  {
    row: 281,
    name: "Putrakalatraheena Yoga",
    classification: "Negative",
    description: "Waning Moon occupies the fifth, with malefics in the first, seventh and twelfth.",
    condition: all(
      lunarPhase("Waning"),
      pos("Moon", [5]),
      ...([1, 7, 12] as const).map((house) => occupiedByMalefic([house])),
    ),
  },
  {
    row: 282,
    name: "Bharyasahavyabhichara Yoga",
    classification: "Negative",
    description: "Moon, Venus, Saturn and Mars conjoin in the seventh.",
    condition: all(pos("Moon", [7]), conjunct("Moon", "Venus", "Saturn", "Mars")),
  },
  {
    row: 283,
    name: "Vamsacheda Yoga",
    classification: "Negative",
    description: "Moon occupies the tenth, Venus the seventh, and malefics the fourth.",
    condition: all(pos("Moon", [10]), pos("Venus", [7]), occupiedByMalefic([4])),
  },
  {
    row: 284,
    name: "Guhyaroga Yoga",
    classification: "Negative",
    description: "Moon joins malefics and occupies Cancer or Scorpio navamsa.",
    condition: all(afflictedByMalefic("Moon"), signs("Moon", ["Cancer", "Scorpio"], 9)),
  },
  {
    row: 285,
    name: "Angaheena Yoga",
    classification: "Negative",
    description: "Moon occupies the tenth, Mars the seventh, and Saturn the second from Sun.",
    // The terminal Sun reference qualifies Saturn; the preceding houses use Lagna.
    condition: all(pos("Moon", [10]), pos("Mars", [7]), pos("Saturn", [2], "Sun")),
  },
  {
    row: 286,
    name: "Swetakushta Yoga",
    classification: "Negative",
    description: "Mars is in the second, Saturn the twelfth, Moon the first, and Sun the seventh.",
    condition: all(pos("Mars", [2]), pos("Saturn", [12]), pos("Moon", [1]), pos("Sun", [7])),
  },
  {
    row: 287,
    name: "Pisacha Grastha Yoga",
    classification: "Negative",
    description: "Rahu and Moon conjoin in Lagna with malefics in trines.",
    condition: all(pos("Rahu", [1]), conjunct("Rahu", "Moon"), occupiedByMalefic([5, 9])),
  },
  {
    row: 288,
    name: "Andha Yoga",
    classification: "Negative",
    description: "Sun and Rahu conjoin in Lagna with malefics in trines.",
    condition: all(pos("Sun", [1]), conjunct("Sun", "Rahu"), occupiedByMalefic([5, 9])),
  },
  {
    row: 289,
    name: "Andha Yoga",
    classification: "Negative",
    description:
      "Mars, Moon, Saturn and Sun occupy the second, sixth, twelfth and eighth respectively.",
    condition: all(pos("Mars", [2]), pos("Moon", [6]), pos("Saturn", [12]), pos("Sun", [8])),
  },
  {
    row: 290,
    name: "Vatharoga Yoga",
    classification: "Negative",
    description: "Jupiter occupies Lagna opposite Saturn in the seventh.",
    condition: all(pos("Jupiter", [1]), pos("Saturn", [7])),
  },
  {
    row: 291,
    name: "Matibhramana Yoga",
    classification: "Negative",
    description: "Jupiter occupies Lagna and Mars the seventh.",
    condition: all(pos("Jupiter", [1]), pos("Mars", [7])),
  },
  {
    row: 292,
    name: "Matibhramana Yoga",
    classification: "Negative",
    description: "Saturn occupies Lagna, with Mars in the fifth, seventh or ninth.",
    condition: all(pos("Saturn", [1]), pos("Mars", [5, 7, 9])),
  },
  {
    row: 293,
    name: "Matibhramana Yoga",
    classification: "Negative",
    description: "Saturn conjoins a waning Moon in the twelfth.",
    condition: all(pos("Saturn", [12]), conjunct("Saturn", "Moon"), lunarPhase("Waning")),
  },
  {
    row: 294,
    name: "Matibhramana Yoga",
    classification: "Negative",
    description:
      "Moon and Mercury occupy kendras and each has another planet's conjunction or aspect.",
    condition: all(
      pos("Moon", kendras),
      pos("Mercury", kendras),
      joinedOrAspectedByOther("Moon", ["Mercury"]),
      joinedOrAspectedByOther("Mercury", ["Moon"]),
    ),
  },
  {
    row: 295,
    name: "Khalwata Yoga",
    classification: "Negative",
    description: "A malefic-ruled Lagna, Sagittarius or Taurus receives a malefic aspect.",
    condition: all(
      any(natural(lord(1), "Malefic"), signs("Lagna", ["Sagittarius", "Taurus"])),
      any(...PLANETS.map((body) => all(natural(body, "Malefic"), aspectHouse(body, 1)))),
    ),
  },
  {
    row: 296,
    name: "Nishturabhashi Yoga",
    classification: "Negative",
    description: "Moon conjoins Saturn.",
    condition: conjunct("Moon", "Saturn"),
  },
  {
    row: 297,
    name: "Rajabhrashta Yoga",
    classification: "Negative",
    description: "The lords of Arudha Lagna and the twelfth-house arudha conjoin.",
    condition: unknown(
      "Row 297 requires Arudha Lagna and Arudha Dwadasa subjects and does not specify whether arudha exceptions apply.",
    ),
  },
  {
    row: 298,
    name: "Raja Yoga",
    classification: "Negative",
    description:
      "Leo rises with exalted Saturn, which has debilitated navamsa or receives a benefic aspect.",
    condition: all(
      signs("Lagna", ["Leo"]),
      dignity("Saturn", ["EXALTED"]),
      any(
        dignity("Saturn", ["DEBILITATED"], 9),
        any(
          ...PLANETS.filter((body) => body !== "Saturn").map((body) =>
            all(natural(body, "Benefic"), aspect(body, "Saturn")),
          ),
        ),
      ),
    ),
  },
  {
    row: 299,
    name: "Raja Yoga",
    classification: "Negative",
    description: "Sun occupies the tenth degree of Libra.",
    condition: longitude("Sun", 189, 190),
  },
  {
    row: 300,
    name: "Gohanta Yoga",
    classification: "Negative",
    description:
      "A malefic occupies a kendra without benefic aspects, while Jupiter occupies the eighth.",
    condition: all(
      pos("Jupiter", [8]),
      any(
        ...PLANETS.map((body) =>
          all(
            natural(body, "Malefic"),
            pos(body, kendras),
            not(
              any(
                ...PLANETS.filter((other) => other !== body).map((other) =>
                  all(natural(other, "Benefic"), aspect(other, body)),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  },
];
