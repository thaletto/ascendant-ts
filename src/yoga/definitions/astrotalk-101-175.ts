import type { Houses } from "../../chart/model.js";
import {
  all,
  any,
  aspect,
  aspectHouse,
  conjunct as formationConjunction,
  dignity,
  dispositor,
  exchange,
  lord,
  not,
  pos,
  same,
  signs,
  unknown,
  type FormationCondition,
  type Subject,
} from "../formation.js";

/** Source: the supplied parsed Astrotalk rows, preserving alternate formations by row.
 * Generic benefic/malefic clauses follow the existing Srik/Sarpa catalog groups.
 * An unnamed group occupant/influencer means at least one member; explicit "and"
 * between named planets requires each. Self-identity is not conjunction/influence.
 * Named amsa grades and unquantified strength remain unknown, never exaltation proxies.
 */
const benefics = ["Mercury", "Jupiter", "Venus"] as const;
const malefics = ["Sun", "Mars", "Saturn", "Rahu", "Ketu"] as const;
const classical = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"] as const;
const planets = [...classical, "Rahu", "Ketu"] as const;
const kendras = [1, 4, 7, 10] as const;
const anglesAndTrines = [1, 4, 5, 7, 9, 10] as const;
const dusthanas = [6, 8, 12] as const;
const movable = ["Aries", "Cancer", "Libra", "Capricorn"] as const;
const water = ["Cancer", "Scorpio", "Pisces"] as const;

function conjunct(...subjects: readonly Subject[]): FormationCondition {
  return all(
    ...subjects.flatMap((p, i) => subjects.slice(i + 1).map((q) => not(same(p, q)))),
    formationConjunction(...subjects),
  );
}
function influence(from: Subject, to: Subject): FormationCondition {
  return all(not(same(from, to)), any(conjunct(from, to), aspect(from, to)));
}
function beneficIdentity(subject: Subject): FormationCondition {
  return any(...benefics.map((p) => same(subject, p)));
}
function beneficAspect(subject: Subject): FormationCondition {
  return any(...benefics.map((p) => aspect(p, subject)));
}
function maleficAspect(subject: Subject): FormationCondition {
  return any(...malefics.map((p) => aspect(p, subject)));
}
function beneficConjunction(subject: Subject): FormationCondition {
  return any(...benefics.map((p) => all(not(same(p, subject)), conjunct(p, subject))));
}
function maleficConjunction(subject: Subject): FormationCondition {
  return any(...malefics.map((p) => all(not(same(p, subject)), conjunct(p, subject))));
}
function beneficInfluence(subject: Subject): FormationCondition {
  return any(...benefics.map((p) => influence(p, subject)));
}
function beneficOccupancy(house: Houses): FormationCondition {
  return any(...benefics.map((p) => pos(p, [house])));
}

export interface Astrotalk101To175Row {
  readonly row: number;
  readonly name: string;
  readonly classification: "Positive" | "Negative" | "Neutral";
  readonly description: string;
  readonly condition: FormationCondition;
}

export const astrotalk101To175 = [
  {
    row: 109,
    name: "Dehapushti Yoga",
    classification: "Positive",
    description: "The Lagna lord occupies a movable sign and receives a benefic aspect.",
    condition: all(signs(lord(1), movable), beneficAspect(lord(1))),
  },
  {
    row: 110,
    name: "Dehakashta Yoga",
    classification: "Negative",
    description: "The Lagna lord joins a malefic or occupies the eighth.",
    condition: any(maleficConjunction(lord(1)), pos(lord(1), [8])),
  },
  {
    row: 111,
    name: "Rogagrastha Yoga",
    classification: "Negative",
    description: "The Lagna lord joins a dusthana lord in Lagna, or is weak in an angle or trine.",
    condition: any(
      all(pos(lord(1), [1]), any(...dusthanas.map((h) => conjunct(lord(1), lord(h))))),
      all(pos(lord(1), anglesAndTrines), unknown("Row 111 does not define weak Lagna lord.")),
    ),
  },
  {
    row: 112,
    name: "Krisanga Yoga",
    classification: "Negative",
    description: "Lagna has the source-defined dry sign or dry ruler qualification.",
    condition: unknown("Row 112 does not identify dry signs or dry planets."),
  },
  {
    row: 113,
    name: "Krisanga Yoga",
    classification: "Negative",
    description:
      "Malefics occupy the natal and Navamsa Lagnas, with a dry planet in Navamsa Lagna.",
    condition: all(
      any(...malefics.map((p) => pos(p, [1]))),
      any(...malefics.map((p) => pos(p, [1], "Lagna", 9))),
      unknown("Row 113 does not identify the dry planet required in Navamsa Lagna."),
    ),
  },
  {
    row: 114,
    name: "Dehasthoulya Yoga",
    classification: "Negative",
    description: "The Lagna lord and its Navamsa dispositor occupy water signs.",
    condition: all(signs(lord(1), water), signs(dispositor(lord(1), 9), water)),
  },
  {
    row: 115,
    name: "Dehasthoulya Yoga",
    classification: "Negative",
    description: "Jupiter occupies Lagna or aspects it from a water sign.",
    condition: any(pos("Jupiter", [1]), all(signs("Jupiter", water), aspect("Jupiter", "Lagna"))),
  },
  {
    row: 116,
    name: "Dehasthoulya Yoga",
    classification: "Negative",
    description: "A water-sign Lagna contains a benefic, or its lord occupies a water sign.",
    condition: any(all(signs("Lagna", water), beneficOccupancy(1)), signs(lord(1), water)),
  },
  {
    row: 117,
    name: "Sada Sanchara Yoga",
    classification: "Positive",
    description: "The Lagna lord or its dispositor occupies a movable sign.",
    condition: any(signs(lord(1), movable), signs(dispositor(lord(1)), movable)),
  },
  {
    row: 118,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Venus occupies its own fifth-house sign and Saturn the eleventh.",
    condition: all(pos("Venus", [5]), dignity("Venus", ["OWN"]), pos("Saturn", [11])),
  },
  {
    row: 119,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Mercury occupies its own fifth-house sign with Moon and Mars in the eleventh.",
    condition: all(
      pos("Mercury", [5]),
      dignity("Mercury", ["OWN"]),
      pos("Moon", [11]),
      pos("Mars", [11]),
    ),
  },
  {
    row: 120,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Saturn occupies its own fifth-house sign with Mercury and Mars in the eleventh.",
    condition: all(
      pos("Saturn", [5]),
      dignity("Saturn", ["OWN"]),
      pos("Mercury", [11]),
      pos("Mars", [11]),
    ),
  },
  {
    row: 121,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Sun occupies Leo in the fifth with Jupiter and Moon in the eleventh.",
    condition: all(pos("Sun", [5]), signs("Sun", ["Leo"]), pos("Jupiter", [11]), pos("Moon", [11])),
  },
  {
    row: 122,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Jupiter occupies its own fifth-house sign with Mars and Moon in the eleventh.",
    condition: all(
      pos("Jupiter", [5]),
      dignity("Jupiter", ["OWN"]),
      pos("Mars", [11]),
      pos("Moon", [11]),
    ),
  },
  {
    row: 123,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Sun occupies Leo Lagna and receives conjunction or aspect from Mars and Jupiter.",
    condition: all(
      pos("Sun", [1]),
      signs("Lagna", ["Leo"]),
      influence("Mars", "Sun"),
      influence("Jupiter", "Sun"),
    ),
  },
  {
    row: 124,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Moon occupies Cancer Lagna and receives aspects from Jupiter and Mars.",
    condition: all(
      pos("Moon", [1]),
      signs("Lagna", ["Cancer"]),
      aspect("Jupiter", "Moon"),
      aspect("Mars", "Moon"),
    ),
  },
  {
    row: 125,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Mars occupies its own Lagna sign and receives conjunction or aspect from Moon.",
    condition: all(pos("Mars", [1]), dignity("Mars", ["OWN"]), influence("Moon", "Mars")),
  },
  {
    row: 126,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Mercury occupies its own Lagna sign with Saturn or Venus influencing it.",
    condition: all(
      pos("Mercury", [1]),
      dignity("Mercury", ["OWN"]),
      any(influence("Saturn", "Mercury"), influence("Venus", "Mercury")),
    ),
  },
  {
    row: 127,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Jupiter occupies its own Lagna sign with Mercury and Mars influencing it.",
    condition: all(
      pos("Jupiter", [1]),
      dignity("Jupiter", ["OWN"]),
      influence("Mercury", "Jupiter"),
      influence("Mars", "Jupiter"),
    ),
  },
  {
    row: 128,
    name: "Dhana Yoga",
    classification: "Positive",
    description: "Venus occupies its own Lagna sign with Saturn and Mercury influencing it.",
    condition: all(
      pos("Venus", [1]),
      dignity("Venus", ["OWN"]),
      influence("Saturn", "Venus"),
      influence("Mercury", "Venus"),
    ),
  },
  {
    row: 129,
    name: "Bahudravyarjana Yoga",
    classification: "Positive",
    description: "Lords of one, two and eleven occupy two, eleven and one respectively.",
    condition: all(pos(lord(1), [2]), pos(lord(2), [11]), pos(lord(11), [1])),
  },
  {
    row: 130,
    name: "Swaveeryaddhana Yoga",
    classification: "Positive",
    description:
      "The strongest Lagna lord joins Jupiter in an angle, with the second lord in Vaiseshikamsa.",
    condition: all(
      pos(lord(1), kendras),
      conjunct(lord(1), "Jupiter"),
      unknown(
        "Row 130 does not define strongest-planet ranking or Vaiseshikamsa for the second lord.",
      ),
    ),
  },
  {
    row: 131,
    name: "Swaveeryaddhana Yoga",
    classification: "Positive",
    description:
      "The nested dispositor of the Lagna lord has strength and angular, trinal, own-sign or exalted placement.",
    condition: any(
      all(
        pos(dispositor(dispositor(lord(1), 9)), anglesAndTrines, lord(2)),
        unknown("Row 131 does not define strength of the nested dispositor."),
      ),
      dignity(dispositor(dispositor(lord(1), 9)), ["OWN", "EXALTED"]),
    ),
  },
  {
    row: 132,
    name: "Swaveeryaddhana Yoga",
    classification: "Positive",
    description:
      "The second lord is angular or trinal to the Lagna lord, or is a benefic with exaltation support.",
    condition: any(
      pos(lord(2), anglesAndTrines, lord(1)),
      all(
        beneficIdentity(lord(2)),
        any(
          all(
            dignity(lord(2), ["EXALTED"]),
            unknown("Row 132 requires deep exaltation; exact-degree evaluation is unsupported."),
          ),
          any(
            ...classical.map((p) =>
              all(not(same(lord(2), p)), conjunct(lord(2), p), dignity(p, ["EXALTED"])),
            ),
          ),
        ),
      ),
    ),
  },
  {
    row: 133,
    name: "Madhya Vayasi Dhana Yoga",
    classification: "Positive",
    description:
      "Lords of two, one and eleven conjoin in an angle or trine with benefic aspect and Kalabala.",
    condition: all(
      conjunct(lord(2), lord(1), lord(11)),
      pos(lord(2), anglesAndTrines),
      beneficAspect(lord(2)),
      unknown("Row 133 gives no qualifying Kalabala threshold for the second lord."),
    ),
  },
  {
    row: 134,
    name: "Anthya Vayasi Dhana Yoga",
    classification: "Positive",
    description: "Lords of one and two join a benefic, whose shared dispositor is strong in Lagna.",
    condition: all(
      conjunct(lord(1), lord(2)),
      beneficConjunction(lord(1)),
      pos(dispositor(lord(1)), [1]),
      unknown("Row 134 does not define strong disposition of the shared sign lord."),
    ),
  },
  {
    row: 135,
    name: "Balya Dhana Yoga",
    classification: "Positive",
    description:
      "Lords of two and ten conjoin in an angle aspected by the Lagna lord's Navamsa dispositor.",
    condition: all(
      conjunct(lord(2), lord(10)),
      pos(lord(2), kendras),
      aspect(dispositor(lord(1), 9), lord(2)),
    ),
  },
  {
    row: 136,
    name: "Bhratrumooladdhanaprapti Yoga",
    classification: "Positive",
    description: "Lords of one and two occupy the third and receive a benefic aspect.",
    condition: all(pos(lord(1), [3]), pos(lord(2), [3]), beneficAspect(lord(1))),
  },
  {
    row: 137,
    name: "Bhratrumooladdhanaprapti Yoga",
    classification: "Positive",
    description:
      "The third lord joins Jupiter in the second and receives influence from the qualified Lagna lord.",
    condition: all(
      pos(lord(3), [2]),
      conjunct(lord(3), "Jupiter"),
      influence(lord(1), lord(3)),
      unknown("Row 137 requires Vaiseshikamsa for the Lagna lord, without defining the grade."),
    ),
  },
  {
    row: 138,
    name: "Matrumooladdhana Yoga",
    classification: "Positive",
    description: "The fourth lord conjoins or aspects the second lord.",
    condition: influence(lord(4), lord(2)),
  },
  {
    row: 139,
    name: "Putramooladdhana Yoga",
    classification: "Positive",
    description:
      "The strong second lord joins the fifth lord or Jupiter, with the Lagna lord in Vaiseshikamsa.",
    condition: all(
      any(conjunct(lord(2), lord(5)), conjunct(lord(2), "Jupiter")),
      unknown("Row 139 leaves second-lord strength and Lagna-lord Vaiseshikamsa undefined."),
    ),
  },
  {
    row: 140,
    name: "Satrumooladdhana Yoga",
    classification: "Positive",
    description:
      "The strong second lord joins the sixth lord or Mars, with a powerful qualified Lagna lord.",
    condition: all(
      any(conjunct(lord(2), lord(6)), conjunct(lord(2), "Mars")),
      unknown("Row 140 leaves second-lord strength, Lagna-lord power and Vaiseshikamsa undefined."),
    ),
  },
  {
    row: 141,
    name: "Kalatramooladdhana Yoga",
    classification: "Positive",
    description:
      "The seventh lord and Venus influence a strong second lord, with a powerful Lagna lord.",
    condition: all(
      influence(lord(7), lord(2)),
      influence("Venus", lord(2)),
      unknown("Row 141 does not define strength of the second and Lagna lords."),
    ),
  },
  {
    row: 142,
    name: "Amaranantha Dhana Yoga",
    classification: "Positive",
    description: "Multiple planets occupy the second, with qualified wealth-giving planets.",
    condition: all(
      any(
        ...planets.map((p, i) =>
          any(...planets.slice(i + 1).map((q) => all(pos(p, [2]), pos(q, [2])))),
        ),
      ),
      any(
        ...planets.map((p) =>
          all(
            pos(p, [2]),
            any(
              dignity(p, ["OWN", "EXALTED"]),
              unknown(`Row 142 does not define strength for ${p}.`),
            ),
            unknown(`Row 142 does not define whether ${p} is a wealth-giving planet.`),
          ),
        ),
      ),
      unknown(
        "Row 142 does not quantify a number of planets; plural occupancy is only a necessary minimum, not a sufficient threshold.",
      ),
    ),
  },
  {
    row: 143,
    name: "Ayatnadhanalabha Yoga",
    classification: "Positive",
    description: "Lords of one and two exchange their signs.",
    condition: exchange(lord(1), lord(2)),
  },
  {
    row: 144,
    name: "Daridra Yoga",
    classification: "Negative",
    description: "Lords of one and twelve exchange signs and receive seventh-lord influence.",
    condition: all(
      exchange(lord(1), lord(12)),
      influence(lord(7), lord(1)),
      influence(lord(7), lord(12)),
    ),
  },
  {
    row: 145,
    name: "Daridra Yoga",
    classification: "Negative",
    description:
      "Lords of one and six exchange signs while the second or seventh lord aspects Moon.",
    condition: all(
      exchange(lord(1), lord(6)),
      any(aspect(lord(2), "Moon"), aspect(lord(7), "Moon")),
    ),
  },
  {
    row: 146,
    name: "Daridra Yoga",
    classification: "Negative",
    description: "Ketu and Moon occupy Lagna.",
    condition: all(pos("Ketu", [1]), pos("Moon", [1])),
  },
  {
    row: 147,
    name: "Daridra Yoga",
    classification: "Negative",
    description: "The Lagna lord occupies the eighth with second- or seventh-lord influence.",
    condition: all(
      pos(lord(1), [8]),
      any(influence(lord(2), lord(1)), influence(lord(7), lord(1))),
    ),
  },
  {
    row: 148,
    name: "Daridra Yoga",
    classification: "Negative",
    description: "The Lagna lord occupies a dusthana with benefic conjunction or aspect.",
    condition: all(pos(lord(1), dusthanas), beneficInfluence(lord(1))),
  },
  {
    row: 149,
    name: "Daridra Yoga",
    classification: "Negative",
    description: "The Lagna lord joins a dusthana lord and receives a malefic aspect.",
    condition: all(
      any(...dusthanas.map((h) => conjunct(lord(1), lord(h)))),
      maleficAspect(lord(1)),
    ),
  },
  {
    row: 150,
    name: "Daridra Yoga",
    classification: "Negative",
    description: "The fifth lord joins a dusthana lord without benefic conjunction or aspect.",
    condition: all(
      any(...dusthanas.map((h) => conjunct(lord(5), lord(h)))),
      not(beneficInfluence(lord(5))),
    ),
  },
  {
    row: 151,
    name: "Daridra Yoga",
    classification: "Negative",
    description:
      "The fifth lord occupies six or ten and is aspected by a listed adverse house lord.",
    condition: all(
      pos(lord(5), [6, 10]),
      any(...([2, 6, 7, 8, 12] as const).map((h) => aspect(lord(h), lord(5)))),
    ),
  },
  {
    row: 152,
    name: "Daridra Yoga",
    classification: "Negative",
    description:
      "A malefic without ninth or tenth ownership occupies Lagna with maraka-lord influence.",
    condition: any(
      ...malefics.map((p) =>
        all(
          not(same(p, lord(9))),
          not(same(p, lord(10))),
          pos(p, [1]),
          any(influence(lord(2), p), influence(lord(7), p)),
        ),
      ),
    ),
  },
  {
    row: 153,
    name: "Daridra Yoga",
    classification: "Negative",
    description:
      "Natal and Navamsa Lagna lords occupy dusthanas with second- and seventh-lord influence.",
    condition: all(
      ...[lord(1), lord(1, "Lagna", 9)].map((p) =>
        all(pos(p, dusthanas), influence(lord(2), p), influence(lord(7), p)),
      ),
    ),
  },
  {
    row: 154,
    name: "Yukthi Samanwithavagmi Yoga",
    classification: "Positive",
    description:
      "The second lord joins a benefic in an angle or trine, or joins Jupiter while exalted.",
    condition: any(
      all(pos(lord(2), anglesAndTrines), beneficConjunction(lord(2))),
      all(dignity(lord(2), ["EXALTED"]), conjunct(lord(2), "Jupiter")),
    ),
  },
  {
    row: 155,
    name: "Yukthi Samanwithavagmi Yoga",
    classification: "Positive",
    description: "The second lord is angular and deeply exalted with named amsa qualifications.",
    condition: all(
      pos(lord(2), kendras),
      dignity(lord(2), ["EXALTED"]),
      unknown(
        "Row 155 requires paramochha, Parvatamsa, and Simhasanamsa for Jupiter or Venus; exact degree and amsa grades are unsupported.",
      ),
    ),
  },
  {
    row: 156,
    name: "Parihasaka Yoga",
    classification: "Positive",
    description: "The Sun's Navamsa dispositor occupies the second with Vaiseshikamsa.",
    condition: all(
      pos(dispositor("Sun", 9), [2]),
      unknown("Row 156 does not define Vaiseshikamsa for the Sun's Navamsa dispositor."),
    ),
  },
  {
    row: 157,
    name: "Asatyavadi Yoga",
    classification: "Negative",
    description:
      "The second lord occupies a Saturn or Mars sign and malefics occupy angles and trines.",
    condition: all(
      signs(lord(2), ["Aries", "Scorpio", "Capricorn", "Aquarius"]),
      any(...malefics.map((p) => pos(p, kendras))),
      any(...malefics.map((p) => pos(p, [1, 5, 9]))),
    ),
  },
  {
    row: 161,
    name: "Saraswathi Yoga",
    classification: "Positive",
    description:
      "Jupiter, Venus and Mercury occupy the listed houses, with Jupiter in a favorable sign.",
    condition: all(
      ...benefics.map((p) => pos(p, [1, 2, 4, 5, 7, 9, 10])),
      dignity("Jupiter", ["OWN", "EXALTED", "FRIEND"]),
    ),
  },
  {
    row: 163,
    name: "Mooka Yoga",
    classification: "Negative",
    description: "The second lord joins Jupiter in the eighth.",
    condition: all(pos(lord(2), [8]), conjunct(lord(2), "Jupiter")),
  },
  {
    row: 164,
    name: "Netranasa Yoga",
    classification: "Negative",
    description:
      "Lords of ten, six and two occupy Lagna, or have the source's Neechamsa placement.",
    condition: any(
      all(pos(lord(10), [1]), pos(lord(6), [1]), pos(lord(2), [1])),
      unknown(
        "Row 164 does not specify the division meant by Neechamsa or unambiguously identify its subjects.",
      ),
    ),
  },
  {
    row: 165,
    name: "Andha Yoga",
    classification: "Negative",
    description:
      "Mercury and Moon occupy the second, or its lord joins the Lagna lord and Sun there.",
    condition: any(
      all(pos("Mercury", [2]), pos("Moon", [2])),
      all(pos(lord(1), [2]), pos(lord(2), [2]), pos("Sun", [2])),
    ),
  },
  {
    row: 166,
    name: "Sumukha Yoga",
    classification: "Positive",
    description:
      "The angular second lord receives a benefic aspect, or a benefic occupies the second.",
    condition: any(all(pos(lord(2), kendras), beneficAspect(lord(2))), beneficOccupancy(2)),
  },
  {
    row: 167,
    name: "Sumukha Yoga",
    classification: "Positive",
    description: "The second lord occupies a favorable angle whose ruler has Gopuramsa.",
    condition: all(
      pos(lord(2), kendras),
      dignity(lord(2), ["EXALTED", "OWN", "FRIEND"]),
      unknown("Row 167 does not define Gopuramsa for the ruler of the occupied angle."),
    ),
  },
  {
    row: 168,
    name: "Durmukha Yoga",
    classification: "Negative",
    description: "A malefic occupies the second, and its lord joins a malefic or is debilitated.",
    condition: all(
      any(...malefics.map((p) => pos(p, [2]))),
      any(maleficConjunction(lord(2)), dignity(lord(2), ["DEBILITATED"])),
    ),
  },
  {
    row: 170,
    name: "Bhojana Soukhya Yoga",
    classification: "Positive",
    description: "The strong second lord has Vaiseshikamsa and receives a Jupiter or Venus aspect.",
    condition: all(
      any(aspect("Jupiter", lord(2)), aspect("Venus", lord(2))),
      unknown("Row 170 does not define second-lord power or Vaiseshikamsa."),
    ),
  },
  {
    row: 171,
    name: "Annadana Yoga",
    classification: "Positive",
    description: "Jupiter and Mercury influence the second lord, which has Vaiseshikamsa.",
    condition: all(
      influence("Jupiter", lord(2)),
      influence("Mercury", lord(2)),
      unknown("Row 171 does not define Vaiseshikamsa for the second lord."),
    ),
  },
  {
    row: 172,
    name: "Parannabhojana Yoga",
    classification: "Negative",
    description:
      "The second lord is debilitated or in an enemy Navamsa and receives a debilitated planet's aspect.",
    condition: all(
      any(dignity(lord(2), ["DEBILITATED"]), dignity(lord(2), ["ENEMY"], 9)),
      any(...classical.map((p) => all(dignity(p, ["DEBILITATED"]), aspect(p, lord(2))))),
    ),
  },
  {
    row: 173,
    name: "Sraddhannabhuktha Yoga",
    classification: "Negative",
    description: "Saturn owns the second, joins its lord, or aspects the second while debilitated.",
    condition: any(
      same("Saturn", lord(2)),
      conjunct("Saturn", lord(2)),
      all(dignity("Saturn", ["DEBILITATED"]), aspectHouse("Saturn", 2)),
    ),
  },
  {
    row: 175,
    name: "Vakchalana Yoga",
    classification: "Negative",
    description:
      "A malefic second lord occupies a cruel Navamsa and the second lacks benefic influence.",
    condition: all(
      any(...malefics.map((p) => same(lord(2), p))),
      not(beneficOccupancy(2)),
      not(any(...benefics.map((p) => aspectHouse(p, 2)))),
      unknown("Row 175 does not define cruel Navamsa."),
    ),
  },
] as const satisfies readonly Astrotalk101To175Row[];

/** Verified against the actual existing conditions, not just the research checklist. */
export const astrotalk101To175Existing = [
  { row: 101, id: "srik", file: "relative-patterns.ts" },
  { row: 102, id: "sarpa", file: "natural-planet-group.ts" },
  { row: 103, id: "duryoga", file: "house-lord-placement.ts" },
  { row: 104, id: "daridra", file: "house-lord-placement.ts" },
  { row: 105, id: "harsha", file: "house-lord-placement.ts" },
  { row: 106, id: "sarala", file: "house-lord-placement.ts" },
  { row: 107, id: "vimala", file: "house-lord-placement.ts" },
  { row: 108, id: "sareera_soukhya", file: "house-lord-combinations.ts" },
  { row: 159, id: "bhaskara", file: "moon-relative.ts" },
  { row: 160, id: "marud", file: "moon-relative.ts" },
  { row: 162, id: "budha", file: "moon-relative.ts" },
] as const;

/** Whole-row exclusions, including otherwise supported alternative clauses. */
export const astrotalk101To175Skipped = [
  { row: 158, reason: "Whole source row mentions Mandi." },
  { row: 169, reason: "Whole source row mentions Gulika." },
  { row: 174, reason: "Whole source row mentions Mandi." },
] as const;
