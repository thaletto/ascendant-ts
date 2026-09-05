import type { Houses } from "../../chart/model.js";
import {
  all,
  any,
  aspect,
  aspectHouse,
  conjunct,
  dignity,
  dispositor,
  lord,
  natural,
  not,
  pos,
  same,
  signNature,
  signs,
  unknown,
  type FormationCondition,
  type Subject,
} from "../formation.js";

const planets = [
  "Sun",
  "Moon",
  "Mars",
  "Mercury",
  "Venus",
  "Jupiter",
  "Saturn",
  "Rahu",
  "Ketu",
] as const;
const kendras = [1, 4, 7, 10] as const;
const trines = [1, 5, 9] as const;
const anglesAndTrines = [1, 4, 5, 7, 9, 10] as const;
const dusthanas = [6, 8, 12] as const;
type NaturalGroup = "Benefic" | "Malefic";

// Quantify over distinct planets; a lord must not serve as its own companion.
// The engine determines conditional lunar nature and unknown node aspects.
function joined(subject: Subject, group: NaturalGroup): FormationCondition {
  return any(
    ...planets.map((body) =>
      all(not(same(subject, body)), natural(body, group), conjunct(body, subject)),
    ),
  );
}
function aspected(subject: Subject, group: NaturalGroup): FormationCondition {
  return any(
    ...planets.map((body) =>
      all(not(same(subject, body)), natural(body, group), aspect(body, subject)),
    ),
  );
}
function contact(subject: Subject, group: NaturalGroup): FormationCondition {
  return any(joined(subject, group), aspected(subject, group));
}
function occupied(
  house: Houses,
  group: NaturalGroup,
  reference: Subject = "Lagna",
): FormationCondition {
  return any(...planets.map((body) => all(natural(body, group), pos(body, [house], reference))));
}
function houseAspected(house: Houses, group: NaturalGroup): FormationCondition {
  return any(...planets.map((body) => all(natural(body, group), aspectHouse(body, house))));
}
function hemmed(subject: Subject): FormationCondition {
  return all(occupied(2, "Malefic", subject), occupied(12, "Malefic", subject));
}

// Natural friendship is directional. Require reciprocity for "are friends";
// the other branch in row 208 independently covers temporary friendship.
const friends = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Venus"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
} as const;
function naturalFriends(a: Subject, b: Subject): FormationCondition {
  const classical = ["Sun", "Moon", "Mars", "Mercury", "Venus", "Jupiter", "Saturn"] as const;
  return any(
    ...classical.flatMap((first) =>
      classical
        .filter(
          (second) =>
            (friends[first] as readonly string[]).includes(second) &&
            (friends[second] as readonly string[]).includes(first),
        )
        .map((second) => all(same(a, first), same(b, second))),
    ),
  );
}

/** Complete row audit: all 68 other rows are represented below; none were already
 * implemented in the pre-batch definitions or checked in docs/research/all-yogas.md.
 * Whole-row exclusions apply even if an alternative could otherwise be evaluated.
 */
export const astrotalk176To244Skips = [
  { row: 204, name: "Kapata Yoga", reason: "Whole source row mentions Mandi." },
] as const;

export const astrotalk176To244: readonly {
  readonly row: number;
  readonly name: string;
  readonly classification: "Positive" | "Negative" | "Neutral";
  readonly description: string;
  readonly condition: FormationCondition;
}[] = [
  {
    row: 176,
    name: "VishapraYoga Yoga",
    classification: "Negative",
    description:
      "Malefics occupy and aspect the second; its lord receives a malefic aspect in an unspecified cruel navamsa.",
    condition: all(
      occupied(2, "Malefic"),
      houseAspected(2, "Malefic"),
      aspected(lord(2), "Malefic"),
      unknown("Row 176 does not define cruel navamsa."),
    ),
  },
  {
    row: 177,
    name: "Bhratruvriddhi Yoga",
    classification: "Positive",
    description:
      "Benefic contact or undefined strength concerns the third house, its lord, or Mars.",
    condition: any(
      contact(lord(3), "Benefic"),
      contact("Mars", "Benefic"),
      occupied(3, "Benefic"),
      houseAspected(3, "Benefic"),
      unknown("Row 177 supplies no strength criterion for the third house, its lord, or Mars."),
    ),
  },
  {
    row: 178,
    name: "Sodaranasa Yoga",
    classification: "Neutral",
    description: "Mars and the third lord occupy the listed houses and receive malefic aspects.",
    condition: all(
      pos("Mars", [8, 3, 5, 7]),
      conjunct("Mars", lord(3)),
      aspected("Mars", "Malefic"),
      aspected(lord(3), "Malefic"),
    ),
  },
  {
    row: 179,
    name: "Ekabhagini Yoga",
    classification: "Positive",
    description: "Mercury occupies the third, its lord joins the Moon, and Mars joins Saturn.",
    condition: all(pos("Mercury", [3]), conjunct(lord(3), "Moon"), conjunct("Mars", "Saturn")),
  },
  {
    row: 180,
    name: "Dwadasa Sahodara Yoga",
    classification: "Positive",
    description:
      "The third lord occupies a quadrant; exalted Mars joins Jupiter in a trine from that lord.",
    condition: all(
      pos(lord(3), kendras),
      dignity("Mars", ["EXALTED"]),
      conjunct("Mars", "Jupiter"),
      pos("Mars", trines, lord(3)),
    ),
  },
  {
    row: 181,
    name: "Sapthasankhya Sahodara Yoga",
    classification: "Positive",
    description:
      "The twelfth lord joins Mars; Moon and Jupiter occupy the third without Venus contact.",
    condition: all(
      conjunct(lord(12), "Mars"),
      pos("Moon", [3]),
      conjunct("Moon", "Jupiter"),
      not(any(conjunct("Venus", "Moon"), aspect("Venus", "Moon"))),
    ),
  },
  {
    row: 182,
    name: "Parakrama Yoga",
    classification: "Positive",
    description:
      "The third lord has a benefic-owned navamsa and benefic contact; Mars occupies a benefic-owned sign.",
    condition: all(
      natural(dispositor(lord(3), 9), "Benefic"),
      contact(lord(3), "Benefic"),
      natural(dispositor("Mars"), "Benefic"),
    ),
  },
  {
    row: 183,
    name: "Yuddha Praveena Yoga",
    classification: "Positive",
    description:
      "The third lord\u2019s successive navamsa dispositors lead to an unspecified own-varga requirement.",
    condition: unknown(
      "Row 183 requires the second successive navamsa dispositor of the third lord to occupy its own vargas, but does not identify those divisions.",
    ),
  },
  {
    row: 184,
    name: "Yuddhatpoorvadridhachitta Yoga",
    classification: "Neutral",
    description: "The exalted third lord joins malefics and occupies a movable sign or navamsa.",
    condition: all(
      dignity(lord(3), ["EXALTED"]),
      joined(lord(3), "Malefic"),
      any(signNature(lord(3), "Movable"), signNature(lord(3), "Movable", 9)),
    ),
  },
  {
    row: 185,
    name: "Yuddhatpaschaddrudha Yoga",
    classification: "Neutral",
    description:
      "The third lord occupies fixed D1 and D9 signs, with a debilitated D1 dispositor and an undefined cruel D60.",
    condition: all(
      signNature(lord(3), "Fixed"),
      signNature(lord(3), "Fixed", 9),
      dignity(dispositor(lord(3)), ["DEBILITATED"]),
      unknown("Row 185 does not define cruel shashtiamsa."),
    ),
  },
  {
    row: 186,
    name: "Satkathadisravana Yoga",
    classification: "Positive",
    description:
      "A benefic owns and aspects the third house; its lord has an unspecified benefic amsa.",
    condition: all(
      natural(lord(3), "Benefic"),
      houseAspected(3, "Benefic"),
      unknown("Row 186 does not identify the division for benefic amsa of the third lord."),
    ),
  },
  {
    row: 187,
    name: "Uttama Griha Yoga",
    classification: "Positive",
    description: "The fourth lord joins a benefic in a quadrant or trine.",
    condition: all(pos(lord(4), anglesAndTrines), joined(lord(4), "Benefic")),
  },
  {
    row: 188,
    name: "Vichitra Saudha Prakara Yoga",
    classification: "Positive",
    description: "The fourth and tenth lords join Saturn and Mars.",
    condition: conjunct(lord(4), lord(10), "Saturn", "Mars"),
  },
  {
    row: 189,
    name: "Ayatna Griha Prapta Yoga",
    classification: "Positive",
    description:
      "The first and seventh lords occupy the first or fourth and receive benefic aspects.",
    condition: all(
      pos(lord(1), [1, 4]),
      pos(lord(7), [1, 4]),
      aspected(lord(1), "Benefic"),
      aspected(lord(7), "Benefic"),
    ),
  },
  {
    row: 190,
    name: "Ayatna Griha Prapta Yoga",
    classification: "Positive",
    description:
      "The ninth lord occupies a quadrant and the fourth lord has one of three specified dignities.",
    condition: all(pos(lord(9), kendras), dignity(lord(4), ["EXALTED", "MOOLA_TRIKONA", "OWN"])),
  },
  {
    row: 191,
    name: "Grihanasa Yoga",
    classification: "Negative",
    description: "The fourth lord occupies the twelfth and receives a malefic aspect.",
    condition: all(pos(lord(4), [12]), aspected(lord(4), "Malefic")),
  },
  {
    row: 192,
    name: "Grihanasa Yoga",
    classification: "Negative",
    description: "The fourth lord\u2019s navamsa dispositor occupies the eleventh in D1.",
    condition: pos(dispositor(lord(4), 9), [11]),
  },
  {
    row: 193,
    name: "Bandhu Pujya Yoga",
    classification: "Positive",
    description:
      "A benefic fourth lord receives another benefic\u2019s aspect while Mercury occupies the ascendant.",
    condition: all(natural(lord(4), "Benefic"), aspected(lord(4), "Benefic"), pos("Mercury", [1])),
  },
  {
    row: 194,
    name: "Bandhu Pujya Yoga",
    classification: "Positive",
    description: "Jupiter occupies or aspects the fourth, or contacts its lord.",
    condition: any(
      pos("Jupiter", [4]),
      aspectHouse("Jupiter", 4),
      conjunct("Jupiter", lord(4)),
      aspect("Jupiter", lord(4)),
    ),
  },
  {
    row: 195,
    name: "Bandhubhisthyaktha Yoga",
    classification: "Negative",
    description:
      "The fourth lord joins a malefic, has an adverse dignity, or occupies an undefined evil D60.",
    condition: any(
      joined(lord(4), "Malefic"),
      dignity(lord(4), ["ENEMY", "DEBILITATED"]),
      unknown("Row 195 does not define evil shashtiamsas."),
    ),
  },
  {
    row: 196,
    name: "Matrudeerghayur Yoga",
    classification: "Positive",
    description:
      "A benefic occupies the fourth, its lord is exalted, and lunar strength remains unspecified.",
    condition: all(
      occupied(4, "Benefic"),
      dignity(lord(4), ["EXALTED"]),
      unknown("Row 196 does not define strong Moon."),
    ),
  },
  {
    row: 197,
    name: "Matrudeerghayur Yoga",
    classification: "Positive",
    description:
      "The fourth lord\u2019s navamsa dispositor occupies quadrants from Lagna and Moon, with unspecified strength.",
    condition: all(
      pos(dispositor(lord(4), 9), kendras),
      pos(dispositor(lord(4), 9), kendras, "Moon"),
      unknown("Row 197 does not define strength of the navamsa dispositor."),
    ),
  },
  {
    row: 198,
    name: "Matrunasa Yoga",
    classification: "Negative",
    description: "The Moon has malefic contact or malefics on both adjacent sides.",
    condition: any(contact("Moon", "Malefic"), hemmed("Moon")),
  },
  {
    row: 199,
    name: "Matrunasa Yoga",
    classification: "Negative",
    description:
      "The fourth lord\u2019s second successive navamsa dispositor occupies a dusthana in D1.",
    condition: pos(dispositor(dispositor(lord(4), 9), 9), dusthanas),
  },
  {
    row: 200,
    name: "Matrugami Yoga",
    classification: "Negative",
    description:
      "Moon or Venus has malefic contact in a quadrant while a malefic occupies the fourth.",
    condition: all(
      any(
        all(pos("Moon", kendras), contact("Moon", "Malefic")),
        all(pos("Venus", kendras), contact("Venus", "Malefic")),
      ),
      occupied(4, "Malefic"),
    ),
  },
  {
    row: 201,
    name: "Sahodareesangama Yoga",
    classification: "Negative",
    description:
      "Venus and the seventh lord join in the fourth with malefic contact or undefined cruel D60 placements.",
    condition: all(
      pos("Venus", [4]),
      conjunct("Venus", lord(7)),
      any(
        all(contact("Venus", "Malefic"), contact(lord(7), "Malefic")),
        unknown("Row 201 does not define cruel shashtiamsas for Venus and the seventh lord."),
      ),
    ),
  },
  {
    row: 202,
    name: "Kapata Yoga",
    classification: "Neutral",
    description:
      "A malefic occupies the fourth and its lord has malefic contact or malefics on both sides.",
    condition: all(occupied(4, "Malefic"), any(contact(lord(4), "Malefic"), hemmed(lord(4)))),
  },
  {
    row: 203,
    name: "Kapata Yoga",
    classification: "Neutral",
    description:
      "Saturn, Mars, Rahu and a malefic tenth lord occupy the fourth; that lord receives a malefic aspect.",
    condition: all(
      pos("Saturn", [4]),
      pos("Mars", [4]),
      pos("Rahu", [4]),
      pos(lord(10), [4]),
      natural(lord(10), "Malefic"),
      aspected(lord(10), "Malefic"),
    ),
  },
  {
    row: 205,
    name: "Nishkapata Yoga",
    classification: "Positive",
    description:
      "The fourth has a benefic occupant or owner, or an occupant with a specified favorable dignity.",
    condition: any(
      occupied(4, "Benefic"),
      natural(lord(4), "Benefic"),
      any(
        ...planets.map((body) => all(pos(body, [4]), dignity(body, ["EXALTED", "FRIEND", "OWN"]))),
      ),
    ),
  },
  {
    row: 206,
    name: "Nishkapata Yoga",
    classification: "Positive",
    description:
      "The ascendant lord has benefic contact in the fourth, or meets an undefined amsa grade.",
    condition: any(
      all(pos(lord(1), [4]), contact(lord(1), "Benefic")),
      unknown("Row 206 does not define Parvata or Uttamamsa for the ascendant lord."),
    ),
  },
  {
    row: 207,
    name: "Matru Satrutwa Yoga",
    classification: "Negative",
    description: "Mercury owns the first and fourth and has malefic contact.",
    condition: all(
      same(lord(1), "Mercury"),
      same(lord(4), "Mercury"),
      contact("Mercury", "Malefic"),
    ),
  },
  {
    row: 208,
    name: "Matru Sneha Yoga",
    classification: "Positive",
    description:
      "The first and fourth lords coincide, are friends, or both receive benefic aspects.",
    condition: any(
      same(lord(1), lord(4)),
      pos(lord(1), [2, 3, 4, 10, 11, 12], lord(4)),
      naturalFriends(lord(1), lord(4)),
      all(aspected(lord(1), "Benefic"), aspected(lord(4), "Benefic")),
    ),
  },
  {
    row: 209,
    name: "Vahana Yoga",
    classification: "Positive",
    description: "The ascendant lord occupies the fourth, ninth, or eleventh.",
    condition: pos(lord(1), [4, 11, 9]),
  },
  {
    row: 210,
    name: "Vahana Yoga",
    classification: "Positive",
    description: "The fourth lord is exalted and its sign lord occupies a quadrant or trine.",
    condition: all(dignity(lord(4), ["EXALTED"]), pos(dispositor(lord(4)), anglesAndTrines)),
  },
  {
    row: 211,
    name: "Anapathya Yoga",
    classification: "Negative",
    description:
      "Weakness is required of Jupiter and the first, seventh, and fifth lords without a defined measure.",
    condition: unknown(
      "Row 211 supplies no weakness criterion for Jupiter or the first, seventh, and fifth lords.",
    ),
  },
  {
    row: 212,
    name: "Sarpasapa Yoga",
    classification: "Negative",
    description: "Rahu occupies the fifth, which receives Mars\u2019s aspect or is ruled by Mars.",
    condition: all(pos("Rahu", [5]), any(aspectHouse("Mars", 5), same(lord(5), "Mars"))),
  },
  {
    row: 213,
    name: "Sarpasapa Yoga",
    classification: "Negative",
    description: "The fifth lord joins Rahu; Saturn occupies the fifth with lunar contact.",
    condition: all(
      conjunct(lord(5), "Rahu"),
      pos("Saturn", [5]),
      any(conjunct("Moon", "Saturn"), aspect("Moon", "Saturn")),
    ),
  },
  {
    row: 214,
    name: "Sarpasapa Yoga",
    classification: "Negative",
    description:
      "Jupiter joins Mars, Rahu occupies the ascendant, and the fifth lord occupies a dusthana.",
    condition: all(conjunct("Jupiter", "Mars"), pos("Rahu", [1]), pos(lord(5), dusthanas)),
  },
  {
    row: 215,
    name: "Sarpasapa Yoga",
    classification: "Negative",
    description: "Rahu occupies a Mars-ruled fifth house with Mercury contact.",
    condition: all(
      pos("Rahu", [5]),
      same(lord(5), "Mars"),
      any(conjunct("Mercury", "Rahu"), aspectHouse("Mercury", 5)),
    ),
  },
  {
    row: 216,
    name: "Pitrusapa Sutakshaya Yoga",
    classification: "Negative",
    description:
      "The Sun occupies the fifth with debility, malefic hemming, or an unspecified Saturn-sign amsa.",
    condition: all(
      pos("Sun", [5]),
      any(
        dignity("Sun", ["DEBILITATED"]),
        hemmed("Sun"),
        unknown("Row 216 names Capricorn and Aquarius amsas without specifying the division."),
      ),
    ),
  },
  {
    row: 217,
    name: "Matrusapa Sutakshaya Yoga",
    classification: "Negative",
    description:
      "The fifth and eighth lords exchange houses; Moon and the fourth lord occupy the sixth.",
    condition: all(pos(lord(8), [5]), pos(lord(5), [8]), pos("Moon", [6]), pos(lord(4), [6])),
  },
  {
    row: 218,
    name: "Bhratrusapa Sutakshaya Yoga",
    classification: "Negative",
    description:
      "The first and fifth lords occupy the eighth; the third lord joins Mars and Rahu in the fifth.",
    condition: all(
      pos(lord(1), [8]),
      pos(lord(5), [8]),
      pos(lord(3), [5]),
      conjunct(lord(3), "Mars", "Rahu"),
    ),
  },
  {
    row: 219,
    name: "Pretasapa Yoga",
    classification: "Negative",
    description:
      "Sun and Saturn occupy the fifth, Moon the seventh, Rahu the first, and Jupiter the twelfth; lunar weakness is undefined.",
    condition: all(
      pos("Sun", [5]),
      pos("Saturn", [5]),
      pos("Moon", [7]),
      pos("Rahu", [1]),
      pos("Jupiter", [12]),
      unknown("Row 219 does not define weak Moon."),
    ),
  },
  {
    row: 220,
    name: "Bahuputra Yoga",
    classification: "Positive",
    description: "Rahu occupies the fifth and avoids Saturn\u2019s navamsa signs.",
    condition: all(pos("Rahu", [5]), not(signs("Rahu", ["Capricorn", "Aquarius"], 9))),
  },
  {
    row: 221,
    name: "Bahuputra Yoga",
    classification: "Positive",
    description:
      "A companion of the seventh lord has its navamsa dispositor in the first, second, or fifth.",
    condition: any(
      ...planets.map((body) =>
        all(not(same(body, lord(7))), conjunct(body, lord(7)), pos(dispositor(body, 9), [1, 2, 5])),
      ),
    ),
  },
  {
    row: 222,
    name: "Dattaputra Yoga",
    classification: "Neutral",
    description:
      "Mars and Saturn occupy the fifth; the ascendant lord occupies Mercury\u2019s sign with Mercury contact.",
    condition: all(
      pos("Mars", [5]),
      pos("Saturn", [5]),
      signs(lord(1), ["Gemini", "Virgo"]),
      any(conjunct("Mercury", lord(1)), aspect("Mercury", lord(1))),
    ),
  },
  {
    row: 223,
    name: "Dattaputra Yoga",
    classification: "Neutral",
    description:
      "The seventh lord occupies the eleventh, the fifth lord joins a benefic, and Mars or Saturn occupies the fifth.",
    condition: all(
      pos(lord(7), [11]),
      joined(lord(5), "Benefic"),
      any(pos("Mars", [5]), pos("Saturn", [5])),
    ),
  },
  {
    row: 224,
    name: "Aputra Yoga",
    classification: "Negative",
    description: "The fifth lord occupies the sixth, eighth, or twelfth.",
    condition: pos(lord(5), dusthanas),
  },
  {
    row: 225,
    name: "Ekaputra Yoga",
    classification: "Neutral",
    description: "The fifth lord occupies a quadrant or trine.",
    condition: pos(lord(5), anglesAndTrines),
  },
  {
    row: 226,
    name: "Suputra Yoga",
    classification: "Neutral",
    description: "Jupiter owns the fifth; the required favorable solar position is undefined.",
    condition: all(
      same(lord(5), "Jupiter"),
      unknown("Row 226 does not define a favorable position for the Sun."),
    ),
  },
  {
    row: 227,
    name: "Kalanirdesat Putra Yoga",
    classification: "Positive",
    description: "Jupiter occupies the fifth and its lord joins Venus.",
    condition: all(pos("Jupiter", [5]), conjunct(lord(5), "Venus")),
  },
  {
    row: 228,
    name: "Kalanirdesat Putra Yoga",
    classification: "Positive",
    description:
      "Jupiter occupies the ninth; Venus is ninth from Jupiter and joins the ascendant lord.",
    condition: all(pos("Jupiter", [9]), pos("Venus", [9], "Jupiter"), conjunct("Venus", lord(1))),
  },
  {
    row: 229,
    name: "Kalanirdesat Putranasa Yoga",
    classification: "Negative",
    description: "Rahu occupies the fifth, its lord joins a malefic, and Jupiter is debilitated.",
    condition: all(
      pos("Rahu", [5]),
      joined(lord(5), "Malefic"),
      dignity("Jupiter", ["DEBILITATED"]),
    ),
  },
  {
    row: 230,
    name: "Kalanirdesat Putranasa Yoga",
    classification: "Negative",
    description:
      "The source\u2019s statement linking malefics, Jupiter, and Lagna omits the necessary relationship.",
    condition: unknown(
      "Row 230 says malefics are Jupiter and Lagna; no positional or relational predicate is specified.",
    ),
  },
  {
    row: 231,
    name: "Buddhimaturya Yoga",
    classification: "Positive",
    description:
      "A benefic fifth lord receives another benefic\u2019s aspect or occupies a benefic-owned sign.",
    condition: all(
      natural(lord(5), "Benefic"),
      any(aspected(lord(5), "Benefic"), natural(dispositor(lord(5)), "Benefic")),
    ),
  },
  {
    row: 232,
    name: "Theevrabuddhi Yoga",
    classification: "Positive",
    description: "A benefic fifth lord has a navamsa dispositor receiving a benefic aspect.",
    condition: all(natural(lord(5), "Benefic"), aspected(dispositor(lord(5), 9), "Benefic")),
  },
  {
    row: 233,
    name: "Buddhi Jada Yoga",
    classification: "Neutral",
    description:
      "Saturn occupies the fifth and aspects the ascendant lord, which also has malefic contact.",
    condition: all(contact(lord(1), "Malefic"), pos("Saturn", [5]), aspect("Saturn", lord(1))),
  },
  {
    row: 234,
    name: "Thrikalagnana Yoga",
    classification: "Positive",
    description:
      "Jupiter receives a benefic aspect with an undefined amsa grade, one alternative also requiring own navamsa.",
    condition: all(
      aspected("Jupiter", "Benefic"),
      any(
        all(dignity("Jupiter", ["OWN"], 9), unknown("Row 234 does not define Mrudwamsa.")),
        unknown("Row 234 does not define Gopuramsa."),
      ),
    ),
  },
  {
    row: 235,
    name: "Putra Sukha Yoga",
    classification: "Positive",
    description:
      "The fifth contains Jupiter and Venus, Mercury, or a benefic in a benefic-owned sign.",
    condition: any(
      all(pos("Jupiter", [5]), pos("Venus", [5])),
      pos("Mercury", [5]),
      all(natural(lord(5), "Benefic"), occupied(5, "Benefic")),
    ),
  },
  {
    row: 236,
    name: "Jara Yoga",
    classification: "Negative",
    description: "The tenth, second, and seventh lords occupy the tenth.",
    condition: all(pos(lord(10), [10]), pos(lord(2), [10]), pos(lord(7), [10])),
  },
  {
    row: 237,
    name: "Jarajaputra Yoga",
    classification: "Negative",
    description:
      "The fifth and seventh lords join the sixth lord and receive benefic aspects; their required strength is undefined.",
    condition: all(
      conjunct(lord(5), lord(7), lord(6)),
      aspected(lord(5), "Benefic"),
      aspected(lord(7), "Benefic"),
      unknown("Row 237 does not define powerful fifth and seventh lords."),
    ),
  },
  {
    row: 238,
    name: "Bahu Stree Yoga",
    classification: "Negative",
    description: "The first and seventh lords conjoin or mutually aspect one another.",
    condition: any(
      conjunct(lord(1), lord(7)),
      all(aspect(lord(1), lord(7)), aspect(lord(7), lord(1))),
    ),
  },
  {
    row: 239,
    name: "Satkalatra Yoga",
    classification: "Positive",
    description:
      "The seventh lord or Venus receives conjunction or aspect from Jupiter or Mercury.",
    condition: any(
      ...[lord(7), "Venus" as const].map((subject) =>
        any(
          ...(["Jupiter", "Mercury"] as const).map((body) =>
            any(conjunct(body, subject), aspect(body, subject)),
          ),
        ),
      ),
    ),
  },
  {
    row: 240,
    name: "Bhaga Chumbana Yoga",
    classification: "Negative",
    description: "The seventh lord joins Venus in the fourth.",
    condition: all(pos(lord(7), [4]), conjunct(lord(7), "Venus")),
  },
  {
    row: 241,
    name: "Bhagya Yoga",
    classification: "Positive",
    description:
      "A benefic occupies the first, third, or fifth and aspects the ninth, with unspecified strength.",
    condition: all(
      any(
        ...planets.map((body) =>
          all(natural(body, "Benefic"), pos(body, [1, 3, 5]), aspectHouse(body, 9)),
        ),
      ),
      unknown("Row 241 does not define strong benefic."),
    ),
  },
  {
    row: 242,
    name: "Jananatpurvam Pitru Marana Yoga",
    classification: "Negative",
    description:
      "Sun occupies a dusthana; the eighth, twelfth, and sixth lords occupy the ninth, first, and fifth.",
    condition: all(pos("Sun", dusthanas), pos(lord(8), [9]), pos(lord(12), [1]), pos(lord(6), [5])),
  },
  {
    row: 243,
    name: "Dhatrutwa Yoga",
    classification: "Positive",
    description:
      "The exalted ninth lord receives a benefic aspect and a benefic occupies the ninth.",
    condition: all(
      dignity(lord(9), ["EXALTED"]),
      aspected(lord(9), "Benefic"),
      occupied(9, "Benefic"),
    ),
  },
  {
    row: 244,
    name: "Apakeerti Yoga",
    classification: "Negative",
    description: "Sun and Saturn occupy the tenth with malefic aspects or undefined malefic amsas.",
    condition: all(
      pos("Sun", [10]),
      pos("Saturn", [10]),
      any(
        all(aspected("Sun", "Malefic"), aspected("Saturn", "Malefic")),
        unknown("Row 244 does not identify the malefic amsa division or predicate."),
      ),
    ),
  },
];
