import { CLASSICAL_PLANETS, PLANETS } from "../../chart/internal/constants.js";
import type { Division, Houses } from "../../chart/model.js";
import {
  all,
  any,
  aspect,
  conjunct,
  dayNight,
  dignity,
  dispositor,
  lord,
  lunarPhase,
  not,
  occupiedSignCount,
  parity,
  pos,
  sex,
  signNature,
  signs,
  unknown,
  type FormationCondition,
  type Subject,
} from "../formation.js";

/** Source: the supplied freshly parsed Astrotalk table, rows 1–100.
 * Generic "all planets" follows the existing nine-body convention; explicitly
 * seven-planet patterns and rows 91–97 use the classical seven, excluding nodes.
 * Generic natural groups follow the existing Srik/Sarpa catalog convention.
 * Source quality "Both" maps to the catalog classification "Neutral".
 * No result prose is copied. The parent owns IDs, result grouping and integration.
 */
interface SourceFormationRow {
  readonly row: number;
  readonly name: string;
  readonly classification: "Positive" | "Negative" | "Neutral";
  readonly description: string;
  readonly condition: FormationCondition;
}

const KENDRAS = [1, 4, 7, 10] as const;
const ANGLES_AND_TRINES = [1, 4, 5, 7, 9, 10] as const;
const NATURAL_GROUPS = {
  Benefic: ["Mercury", "Jupiter", "Venus"],
  Malefic: ["Sun", "Mars", "Saturn", "Rahu", "Ketu"],
} as const;
type NaturalGroup = keyof typeof NATURAL_GROUPS;

function atLeastOne(
  subjects: readonly Subject[],
  houses: readonly Houses[],
  reference: Subject = "Lagna",
): FormationCondition {
  return any(...subjects.map((subject) => pos(subject, houses, reference)));
}

function confined(subjects: readonly Subject[], houses: readonly Houses[]): FormationCondition {
  return all(...subjects.map((subject) => pos(subject, houses)));
}

function groupAt(
  group: NaturalGroup,
  houses: readonly Houses[],
  reference: Subject = "Lagna",
): FormationCondition {
  return atLeastOne(NATURAL_GROUPS[group], houses, reference);
}

function groupConfined(
  group: NaturalGroup,
  houses: readonly Houses[],
  reference: Subject = "Lagna",
): FormationCondition {
  return all(...NATURAL_GROUPS[group].map((body) => pos(body, houses, reference)));
}

function clearOrBenefic(house: Houses): FormationCondition {
  return all(
    ...PLANETS.filter((body) => !NATURAL_GROUPS.Benefic.some((benefic) => benefic === body)).map(
      (body) => not(pos(body, [house])),
    ),
  );
}

function beneficsWithDignity(houses: readonly Houses[], division: Division): FormationCondition {
  return all(
    ...NATURAL_GROUPS.Benefic.map((body) =>
      all(pos(body, houses), dignity(body, ["EXALTED", "OWN", "FRIEND"], division)),
    ),
  );
}

function occupiedWindow(start: Houses): FormationCondition {
  const houses = Array.from(
    { length: 7 },
    (_, offset) => (((start - 1 + offset) % 12) + 1) as Houses,
  );
  return all(confined(PLANETS, houses), ...houses.map((house) => atLeastOne(PLANETS, [house])));
}

export const astrotalk1To100: readonly SourceFormationRow[] = [
  {
    row: 14,
    name: "Parvata Yoga",
    classification: "Positive",
    description: "Either the sixth or eighth is empty or contains only benefics.",
    condition: any(clearOrBenefic(6), clearOrBenefic(8)),
  },
  {
    row: 15,
    name: "Kahala Yoga",
    classification: "Neutral",
    description: "The fourth and ninth lords occupy mutual kendras.",
    condition: pos(lord(4), KENDRAS, lord(9)),
  },
  {
    row: 25,
    name: "Mahabhagya Yoga",
    classification: "Positive",
    description:
      "Daytime male births require odd signs; nighttime female births require even signs for Sun, Moon and Lagna.",
    condition: any(
      all(
        sex("Male"),
        dayNight("Day"),
        ...(["Sun", "Moon", "Lagna"] as const).map((body) => parity(body, "Odd")),
      ),
      all(
        sex("Female"),
        dayNight("Night"),
        ...(["Sun", "Moon", "Lagna"] as const).map((body) => parity(body, "Even")),
      ),
    ),
  },
  {
    row: 26,
    name: "Pushkala Yoga",
    classification: "Positive",
    description:
      "The Moon joins the Lagna lord; its dispositor aspects Lagna from the specified placement, with a powerful Lagna occupant.",
    condition: all(
      conjunct("Moon", lord(1)),
      any(
        pos(dispositor("Moon"), KENDRAS),
        unknown("Row 26 does not define an intimate-friend sign rule."),
      ),
      aspect(dispositor("Moon"), "Lagna"),
      atLeastOne(PLANETS, [1]),
      unknown("Row 26 does not define the power required of the Lagna occupant."),
    ),
  },
  {
    row: 27,
    name: "Lakshmi Yoga",
    classification: "Positive",
    description:
      "The ninth lord occupies an own or exaltation sign in a kendra or trine; Lagna-lord power remains undefined.",
    condition: all(
      pos(lord(9), ANGLES_AND_TRINES),
      dignity(lord(9), ["OWN", "EXALTED"]),
      unknown("Row 27 does not define a powerful Lagna lord."),
    ),
  },
  {
    row: 28,
    name: "Gauri Yoga",
    classification: "Positive",
    description:
      "The tenth lord’s Navamsa dispositor is exalted in the tenth and joins the Lagna lord.",
    condition: all(
      pos(dispositor(lord(10), 9), [10]),
      dignity(dispositor(lord(10), 9), ["EXALTED"]),
      conjunct(dispositor(lord(10), 9), lord(1)),
    ),
  },
  {
    row: 29,
    name: "Bharathi Yoga",
    classification: "Positive",
    description:
      "The Navamsa dispositors of the second, fifth and eleventh lords are exalted and join the ninth lord.",
    condition: all(
      ...([2, 5, 11] as const).map((house) =>
        all(
          dignity(dispositor(lord(house), 9), ["EXALTED"]),
          conjunct(dispositor(lord(house), 9), lord(9)),
        ),
      ),
    ),
  },
  {
    row: 30,
    name: "Chapa Yoga",
    classification: "Positive",
    description: "The Lagna lord is exalted while the fourth and tenth lords exchange houses.",
    condition: all(dignity(lord(1), ["EXALTED"]), pos(lord(4), [10]), pos(lord(10), [4])),
  },
  {
    row: 31,
    name: "Sreenatha yoga",
    classification: "Positive",
    description: "The exalted seventh lord occupies the tenth, whose lord joins the ninth lord.",
    condition: all(dignity(lord(7), ["EXALTED"]), pos(lord(7), [10]), conjunct(lord(10), lord(9))),
  },
  {
    row: 44,
    name: "Sankha Yoga",
    classification: "Positive",
    description:
      "The fifth and sixth lords occupy mutual kendras, with an undefined powerful Lagna lord.",
    condition: all(
      pos(lord(5), KENDRAS, lord(6)),
      unknown("Row 44 does not define a powerful Lagna lord."),
    ),
  },
  {
    row: 45,
    name: "Bheri Yoga",
    classification: "Positive",
    description: "Venus and Jupiter occupy mutual kendras, with undefined ninth-lord power.",
    condition: all(
      pos("Venus", KENDRAS, "Jupiter"),
      unknown("Row 45 does not define a powerfully disposed ninth lord."),
    ),
  },
  {
    row: 46,
    name: "Mridanga Yoga",
    classification: "Positive",
    description:
      "An exalted planet’s Navamsa dispositor occupies a friendly or exaltation sign in a kendra or trine; Lagna-lord strength is unspecified.",
    condition: all(
      any(
        ...CLASSICAL_PLANETS.map((body) =>
          all(
            dignity(body, ["EXALTED"]),
            pos(dispositor(body, 9), ANGLES_AND_TRINES),
            dignity(dispositor(body, 9), ["FRIEND", "EXALTED"]),
          ),
        ),
      ),
      unknown("Row 46 does not define a strongly disposed Lagna lord."),
    ),
  },
  {
    row: 47,
    name: "Parijatha Yoga",
    classification: "Positive",
    description:
      "A further sign or Navamsa dispositor in the Lagna-lord chain occupies a kendra, trine, own or exaltation sign.",
    condition: any(
      ...[dispositor(dispositor(lord(1))), dispositor(dispositor(lord(1)), 9)].map((subject) =>
        any(pos(subject, ANGLES_AND_TRINES), dignity(subject, ["OWN", "EXALTED"])),
      ),
    ),
  },
  {
    row: 48,
    name: "Gaja Yoga",
    classification: "Positive",
    description:
      "The ninth lord counted from the eleventh joins the Moon in the eleventh and receives the eleventh lord’s aspect.",
    condition: all(pos(lord(7), [11]), conjunct(lord(7), "Moon"), aspect(lord(11), lord(7))),
  },
  {
    row: 49,
    name: "Kalanidhi Yoga",
    classification: "Positive",
    description:
      "Jupiter in the second or fifth either joins Mercury and Venus or occupies a sign ruled by either.",
    condition: all(
      pos("Jupiter", [2, 5]),
      any(
        conjunct("Jupiter", "Mercury", "Venus"),
        signs("Jupiter", ["Gemini", "Virgo", "Taurus", "Libra"]),
      ),
    ),
  },
  {
    row: 50,
    name: "Amsavatara Yoga",
    classification: "Positive",
    description: "A movable Lagna accompanies angular Venus, Jupiter and exalted Saturn.",
    condition: all(
      signNature("Lagna", "Movable"),
      pos("Venus", KENDRAS),
      pos("Jupiter", KENDRAS),
      pos("Saturn", KENDRAS),
      dignity("Saturn", ["EXALTED"]),
    ),
  },
  {
    row: 51,
    name: "Harihara Brahma Yoga",
    classification: "Positive",
    description:
      "Three alternatives use benefics relative to the second lord, or specified planets relative to the seventh or Lagna lord.",
    condition: any(
      groupConfined("Benefic", [8, 12], lord(2)),
      all(pos("Jupiter", [4], lord(7)), pos("Moon", [9], lord(7)), pos("Mercury", [8], lord(7))),
      all(pos("Sun", [4], lord(1)), pos("Venus", [10], lord(1)), pos("Mars", [11], lord(1))),
    ),
  },
  {
    row: 53,
    name: "Matsya Yoga",
    classification: "Positive",
    description:
      "Malefics occupy the first, ninth, fourth and eighth; both natural groups occupy the fifth.",
    condition: all(
      ...([1, 9, 4, 8] as const).map((house) => groupAt("Malefic", [house])),
      groupAt("Malefic", [5]),
      groupAt("Benefic", [5]),
    ),
  },
  {
    row: 54,
    name: "Kurma Yoga",
    classification: "Positive",
    description:
      "Benefics occupy the fifth through seventh with suitable Navamsa dignity, or the first, third and eleventh with suitable natal dignity.",
    condition: any(beneficsWithDignity([5, 6, 7], 9), beneficsWithDignity([1, 3, 11], 1)),
  },
  {
    row: 55,
    name: "Devendra Yoga",
    classification: "Positive",
    description:
      "A fixed Lagna accompanies exchanges of the first and eleventh lords and of the second and tenth lords.",
    condition: all(
      signNature("Lagna", "Fixed"),
      pos(lord(1), [11]),
      pos(lord(11), [1]),
      pos(lord(2), [10]),
      pos(lord(10), [2]),
    ),
  },
  {
    row: 56,
    name: "Makuta Yoga",
    classification: "Neutral",
    description:
      "Jupiter is ninth from the ninth lord, a benefic is ninth from Jupiter, and Saturn occupies the tenth.",
    condition: all(
      pos("Jupiter", [9], lord(9)),
      groupAt("Benefic", [9], "Jupiter"),
      pos("Saturn", [10]),
    ),
  },
  {
    row: 57,
    name: "Chandika Yoga",
    classification: "Positive",
    description:
      "The sixth and ninth lords’ Navamsa dispositors join the Sun, while the sixth lord aspects a fixed Lagna.",
    condition: all(
      conjunct(dispositor(lord(6), 9), dispositor(lord(9), 9), "Sun"),
      signNature("Lagna", "Fixed"),
      aspect(lord(6), "Lagna"),
    ),
  },
  {
    row: 58,
    name: "Jaya Yoga",
    classification: "Positive",
    description:
      "The sixth lord is debilitated and the tenth lord is exalted, with deep-exaltation precision unspecified.",
    condition: all(
      dignity(lord(6), ["DEBILITATED"]),
      dignity(lord(10), ["EXALTED"]),
      unknown("Row 58 requires deep exaltation without defining an exact-degree tolerance."),
    ),
  },
  {
    row: 59,
    name: "Vidyut Yoga",
    classification: "Positive",
    description:
      "The exalted eleventh lord joins Venus in a kendra from the Lagna lord; deep-exaltation precision is unspecified.",
    condition: all(
      dignity(lord(11), ["EXALTED"]),
      conjunct(lord(11), "Venus"),
      pos(lord(11), KENDRAS, lord(1)),
      unknown("Row 59 requires deep exaltation without defining an exact-degree tolerance."),
    ),
  },
  {
    row: 60,
    name: "Gandharva Yoga",
    classification: "Positive",
    description:
      "The tenth lord occupies a kama trine, Lagna lord joins Jupiter, Sun is exalted, and Moon occupies the ninth; solar strength is unspecified.",
    condition: all(
      pos(lord(10), [3, 7, 11]),
      conjunct(lord(1), "Jupiter"),
      dignity("Sun", ["EXALTED"]),
      pos("Moon", [9]),
      unknown("Row 60 separately requires a strong Sun without a strength rule."),
    ),
  },
  {
    row: 62,
    name: "Vishnu Yoga",
    classification: "Positive",
    description:
      "The ninth lord’s Navamsa dispositor and the tenth lord join the ninth lord in the second.",
    condition: all(
      pos(dispositor(lord(9), 9), [2]),
      pos(lord(10), [2]),
      conjunct(dispositor(lord(9), 9), lord(10), lord(9)),
    ),
  },
  {
    row: 63,
    name: "Brahma Yoga",
    classification: "Positive",
    description:
      "Jupiter and Venus are angular from the ninth and eleventh lords respectively; Mercury is angular from the first or tenth lord.",
    condition: all(
      pos("Jupiter", KENDRAS, lord(9)),
      pos("Venus", KENDRAS, lord(11)),
      any(pos("Mercury", KENDRAS, lord(1)), pos("Mercury", KENDRAS, lord(10))),
    ),
  },
  {
    row: 64,
    name: "Indra Yoga",
    classification: "Neutral",
    description: "The fifth and eleventh lords exchange houses and the Moon occupies the fifth.",
    condition: all(pos(lord(5), [11]), pos(lord(11), [5]), pos("Moon", [5])),
  },
  {
    row: 65,
    name: "Ravi Yoga",
    classification: "Positive",
    description: "The Sun occupies the tenth and its house lord joins Saturn in the third.",
    condition: all(pos("Sun", [10]), pos(lord(10), [3]), conjunct(lord(10), "Saturn")),
  },
  {
    row: 66,
    name: "Garuda Yoga",
    classification: "Positive",
    description: "The Moon’s Navamsa dispositor is exalted, with a waxing Moon and daytime birth.",
    condition: all(
      dignity(dispositor("Moon", 9), ["EXALTED"]),
      dayNight("Day"),
      lunarPhase("Waxing"),
    ),
  },
  {
    row: 67,
    name: "Go Yoga",
    classification: "Positive",
    description:
      "Jupiter in moolatrikona joins the second lord and the Lagna lord is exalted; Jupiter’s additional strength is undefined.",
    condition: all(
      dignity("Jupiter", ["MOOLA_TRIKONA"]),
      conjunct("Jupiter", lord(2)),
      dignity(lord(1), ["EXALTED"]),
      unknown(
        "Row 67 requires strong Jupiter in addition to moolatrikona, without a strength rule.",
      ),
    ),
  },
  {
    row: 68,
    name: "Gola Yoga",
    classification: "Positive",
    description:
      "A full Moon joins Jupiter and Venus in the ninth, while Mercury occupies Navamsa Lagna.",
    condition: all(
      lunarPhase("Full"),
      pos("Moon", [9]),
      conjunct("Moon", "Jupiter", "Venus"),
      pos("Mercury", [1], "Lagna", 9),
    ),
  },
  {
    row: 79,
    name: "Ardha Chandra Yoga",
    classification: "Positive",
    description:
      "All modeled planets fill a seven-house run beginning in a succedent or cadent house.",
    condition: any(...([2, 3, 5, 6, 8, 9, 11, 12] as const).map((start) => occupiedWindow(start))),
  },
  {
    row: 81,
    name: "Gada Yoga",
    classification: "Positive",
    description: "All modeled planets occupy a pair of adjacent kendras.",
    condition: any(
      ...(
        [
          [1, 4],
          [4, 7],
          [7, 10],
          [10, 1],
        ] as const
      ).map((houses) => confined(PLANETS, houses)),
    ),
  },
  {
    row: 82,
    name: "Sakata Yoga",
    classification: "Negative",
    description: "All modeled planets are confined to the first and seventh houses.",
    condition: confined(PLANETS, [1, 7]),
  },
  {
    row: 83,
    name: "Vihaga Yoga",
    classification: "Negative",
    description: "All modeled planets are confined to the fourth and tenth houses.",
    condition: confined(PLANETS, [4, 10]),
  },
  {
    row: 84,
    name: "Vajra Yoga",
    classification: "Positive",
    description:
      "Benefics occupy the first and seventh, while malefics occupy the fourth and tenth.",
    condition: all(
      groupConfined("Benefic", [1, 7]),
      groupConfined("Malefic", [4, 10]),
      groupAt("Benefic", [1]),
      groupAt("Benefic", [7]),
      groupAt("Malefic", [4]),
      groupAt("Malefic", [10]),
    ),
  },
  {
    row: 85,
    name: "Yava Yoga",
    classification: "Positive",
    description:
      "Malefics occupy the first and seventh, while benefics occupy the fourth and tenth.",
    condition: all(
      groupConfined("Malefic", [1, 7]),
      groupConfined("Benefic", [4, 10]),
      groupAt("Malefic", [1]),
      groupAt("Malefic", [7]),
      groupAt("Benefic", [4]),
      groupAt("Benefic", [10]),
    ),
  },
  {
    row: 86,
    name: "Sringhataka Yoga",
    classification: "Positive",
    description: "All modeled planets occupy the first, fifth or ninth house.",
    condition: confined(PLANETS, [1, 5, 9]),
  },
  {
    row: 87,
    name: "Hala Yoga",
    classification: "Positive",
    description: "All modeled planets occupy one of the three trinal sets outside the Lagna trine.",
    condition: any(
      confined(PLANETS, [2, 6, 10]),
      confined(PLANETS, [3, 7, 11]),
      confined(PLANETS, [4, 8, 12]),
    ),
  },
  {
    row: 91,
    name: "Vallaki Yoga",
    classification: "Positive",
    description: "The seven classical planets occupy exactly 7 distinct signs.",
    condition: occupiedSignCount(CLASSICAL_PLANETS, 7),
  },
  {
    row: 92,
    name: "Damni Yoga",
    classification: "Positive",
    description: "The seven classical planets occupy exactly 6 distinct signs.",
    condition: occupiedSignCount(CLASSICAL_PLANETS, 6),
  },
  {
    row: 93,
    name: "Pasa Yoga",
    classification: "Positive",
    description: "The seven classical planets occupy exactly 5 distinct signs.",
    condition: occupiedSignCount(CLASSICAL_PLANETS, 5),
  },
  {
    row: 94,
    name: "Kedara Yoga",
    classification: "Positive",
    description: "The seven classical planets occupy exactly 4 distinct signs.",
    condition: occupiedSignCount(CLASSICAL_PLANETS, 4),
  },
  {
    row: 95,
    name: "Sula Yoga",
    classification: "Neutral",
    description: "The seven classical planets occupy exactly 3 distinct signs.",
    condition: occupiedSignCount(CLASSICAL_PLANETS, 3),
  },
  {
    row: 96,
    name: "Yuga Yoga",
    classification: "Negative",
    description: "The seven classical planets occupy exactly 2 distinct signs.",
    condition: occupiedSignCount(CLASSICAL_PLANETS, 2),
  },
  {
    row: 97,
    name: "Gola Yoga",
    classification: "Positive",
    description: "The seven classical planets occupy exactly 1 distinct sign.",
    condition: occupiedSignCount(CLASSICAL_PLANETS, 1),
  },
];

/** Complete source audit; existing rows are deliberately not duplicated above. */
export const astrotalk1To100Coverage = [
  { row: 1, name: "Gajakesari Yoga", status: "existing", id: "gajakesari" },
  { row: 2, name: "Sunapha Yoga", status: "existing", id: "sunapha" },
  { row: 3, name: "Anapha Yoga", status: "existing", id: "anapha" },
  { row: 4, name: "Dhurdhua Yoga", status: "existing", id: "dhurdhua" },
  { row: 5, name: "Kemadruma Yoga", status: "existing", id: "kemadruma" },
  { row: 6, name: "Chandra Mangala Yoga", status: "existing", id: "chandra_mangala" },
  { row: 7, name: "Adhi Yoga", status: "existing", id: "adhi" },
  { row: 8, name: "Chatussagara Yoga", status: "existing", id: "chatussagara" },
  { row: 9, name: "Vasumathi Yoga", status: "existing", id: "vasumathi" },
  { row: 10, name: "Rajalakshana Yoga", status: "existing", id: "rajalakshana" },
  {
    row: 11,
    name: "Vanchana Chora Bheethi Yoga",
    status: "skipped",
    reason:
      "Whole row excluded: its formation mentions Gulika, including alternatives that omit it.",
  },
  { row: 12, name: "Sakata Yoga", status: "existing", id: "sakata" },
  { row: 13, name: "Amala Yoga", status: "existing", id: "amala" },
  { row: 14, name: "Parvata Yoga", status: "represented" },
  { row: 15, name: "Kahala Yoga", status: "represented" },
  { row: 16, name: "Vesi Yoga", status: "existing", id: "vesi" },
  { row: 17, name: "Vasi Yoga", status: "existing", id: "vasi" },
  { row: 18, name: "Obhayachari Yoga", status: "existing", id: "obhayachari" },
  { row: 19, name: "Hamsa Yoga", status: "existing", id: "hamsa" },
  { row: 20, name: "Malavya Yoga", status: "existing", id: "malavya" },
  { row: 21, name: "Sasa Yoga", status: "existing", id: "sasa" },
  { row: 22, name: "Ruchaka Yoga", status: "existing", id: "ruchaka" },
  { row: 23, name: "Bhadra Yoga", status: "existing", id: "bhadra" },
  { row: 24, name: "Budha-Aditya Yoga", status: "existing", id: "budha_aditya" },
  { row: 25, name: "Mahabhagya Yoga", status: "represented" },
  { row: 26, name: "Pushkala Yoga", status: "represented" },
  { row: 27, name: "Lakshmi Yoga", status: "represented" },
  { row: 28, name: "Gauri Yoga", status: "represented" },
  { row: 29, name: "Bharathi Yoga", status: "represented" },
  { row: 30, name: "Chapa Yoga", status: "represented" },
  { row: 31, name: "Sreenatha yoga", status: "represented" },
  { row: 32, name: "Lagna Malika", status: "existing", id: "lagna_malika" },
  { row: 33, name: "Dhana Malika", status: "existing", id: "dhana_malika" },
  { row: 34, name: "Vikrama Malika", status: "existing", id: "vikrama_malika" },
  { row: 35, name: "Sukha Malika", status: "existing", id: "sukha_malika" },
  { row: 36, name: "Putra Malika", status: "existing", id: "putra_malika" },
  { row: 37, name: "Satru Malika", status: "existing", id: "satru_malika" },
  { row: 38, name: "Kalatra Malika", status: "existing", id: "kalatra_malika" },
  { row: 39, name: "Randhra Malika", status: "existing", id: "randhra_malika" },
  { row: 40, name: "Bhagya Malika", status: "existing", id: "bhagya_malika" },
  { row: 41, name: "Karma Malika", status: "existing", id: "karma_malika" },
  { row: 42, name: "Labha Malika", status: "existing", id: "labha_malika" },
  { row: 43, name: "Vraya Malika", status: "existing", id: "vraya_malika" },
  { row: 44, name: "Sankha Yoga", status: "represented" },
  { row: 45, name: "Bheri Yoga", status: "represented" },
  { row: 46, name: "Mridanga Yoga", status: "represented" },
  { row: 47, name: "Parijatha Yoga", status: "represented" },
  { row: 48, name: "Gaja Yoga", status: "represented" },
  { row: 49, name: "Kalanidhi Yoga", status: "represented" },
  { row: 50, name: "Amsavatara Yoga", status: "represented" },
  { row: 51, name: "Harihara Brahma Yoga", status: "represented" },
  { row: 52, name: "Kusuma Yoga", status: "existing", id: "kusuma" },
  { row: 53, name: "Matsya Yoga", status: "represented" },
  { row: 54, name: "Kurma Yoga", status: "represented" },
  { row: 55, name: "Devendra Yoga", status: "represented" },
  { row: 56, name: "Makuta Yoga", status: "represented" },
  { row: 57, name: "Chandika Yoga", status: "represented" },
  { row: 58, name: "Jaya Yoga", status: "represented" },
  { row: 59, name: "Vidyut Yoga", status: "represented" },
  { row: 60, name: "Gandharva Yoga", status: "represented" },
  { row: 61, name: "Siva Yoga", status: "existing", id: "siva" },
  { row: 62, name: "Vishnu Yoga", status: "represented" },
  { row: 63, name: "Brahma Yoga", status: "represented" },
  { row: 64, name: "Indra Yoga", status: "represented" },
  { row: 65, name: "Ravi Yoga", status: "represented" },
  { row: 66, name: "Garuda Yoga", status: "represented" },
  { row: 67, name: "Go Yoga", status: "represented" },
  { row: 68, name: "Gola Yoga", status: "represented" },
  { row: 69, name: "Thrilochana Yoga", status: "existing", id: "thrilochana" },
  { row: 70, name: "Kulavardhana Yoga", status: "existing", id: "kulavardhana" },
  { row: 71, name: "Yupa Yoga", status: "existing", id: "yupa" },
  { row: 72, name: "Ishu Yoga", status: "existing", id: "ishu" },
  { row: 73, name: "Sakti Yoga", status: "existing", id: "sakti" },
  { row: 74, name: "Danda Yoga", status: "existing", id: "danda" },
  { row: 75, name: "Nav Yoga", status: "existing", id: "nav" },
  { row: 76, name: "Kuta Yoga", status: "existing", id: "kuta" },
  { row: 77, name: "Chhatra Yoga", status: "existing", id: "chhatra" },
  { row: 78, name: "Chapa Yoga", status: "existing", id: "chapa_continuous" },
  { row: 79, name: "Ardha Chandra Yoga", status: "represented" },
  { row: 80, name: "Chandra Yoga", status: "existing", id: "chandra" },
  { row: 81, name: "Gada Yoga", status: "represented" },
  { row: 82, name: "Sakata Yoga", status: "represented" },
  { row: 83, name: "Vihaga Yoga", status: "represented" },
  { row: 84, name: "Vajra Yoga", status: "represented" },
  { row: 85, name: "Yava Yoga", status: "represented" },
  { row: 86, name: "Sringhataka Yoga", status: "represented" },
  { row: 87, name: "Hala Yoga", status: "represented" },
  { row: 88, name: "Kamala Yoga", status: "existing", id: "kamala" },
  { row: 89, name: "Vapee Yoga", status: "existing", id: "vapee" },
  { row: 90, name: "Samudra Yoga", status: "existing", id: "samudra" },
  { row: 91, name: "Vallaki Yoga", status: "represented" },
  { row: 92, name: "Damni Yoga", status: "represented" },
  { row: 93, name: "Pasa Yoga", status: "represented" },
  { row: 94, name: "Kedara Yoga", status: "represented" },
  { row: 95, name: "Sula Yoga", status: "represented" },
  { row: 96, name: "Yuga Yoga", status: "represented" },
  { row: 97, name: "Gola Yoga", status: "represented" },
  { row: 98, name: "Rajju Yoga", status: "existing", id: "rajju" },
  { row: 99, name: "Musala Yoga", status: "existing", id: "musala" },
  { row: 100, name: "Nala Yoga", status: "existing", id: "nala" },
] as const;
