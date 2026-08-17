import { NAKSHATRA_NAMES, RASHI_NAMES } from "./index";
import { Planets, RashiLords, Rashis, Nakshatra } from "../types";

export const SIGN_LORDS: Record<typeof Rashis.Type, typeof RashiLords.Type> = {
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

const NAKSHATRA_LORD_CYCLE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury",
] as const;

export const EXALTATION: Record<typeof Planets.Type, typeof Rashis.Type> = {
  Sun: "Aries",
  Moon: "Taurus",
  Mars: "Capricorn",
  Mercury: "Virgo",
  Jupiter: "Cancer",
  Venus: "Pisces",
  Saturn: "Libra",
  Rahu: "Taurus",
  Ketu: "Scorpio",
};

export const MOOLA_TRIKONA: Record<typeof Planets.Type, typeof Rashis.Type> = {
  Sun: "Leo",
  Moon: "Taurus",
  Mars: "Aries",
  Mercury: "Virgo",
  Jupiter: "Sagittarius",
  Venus: "Libra",
  Saturn: "Aquarius",
  Rahu: "Aquarius",
  Ketu: "Scorpio",
};

export const OWN_SIGNS: Record<typeof Planets.Type, readonly (typeof Rashis.Type)[]> = {
  Sun: ["Leo"],
  Moon: ["Cancer"],
  Mars: ["Aries", "Scorpio"],
  Mercury: ["Gemini", "Virgo"],
  Jupiter: ["Sagittarius", "Pisces"],
  Venus: ["Taurus", "Libra"],
  Saturn: ["Capricorn", "Aquarius"],
  Rahu: ["Aquarius"],
  Ketu: ["Scorpio"],
};

export const FRIENDS: Record<typeof Planets.Type, readonly (typeof Planets.Type)[]> = {
  Sun: ["Moon", "Mars", "Jupiter"],
  Moon: ["Sun", "Mercury"],
  Mars: ["Sun", "Moon", "Jupiter"],
  Mercury: ["Sun", "Moon"],
  Jupiter: ["Sun", "Moon", "Mars"],
  Venus: ["Mercury", "Saturn"],
  Saturn: ["Mercury", "Venus"],
  Rahu: ["Venus", "Saturn"],
  Ketu: ["Mars"],
};

export const ENEMIES: Record<typeof Planets.Type, readonly (typeof Planets.Type)[]> = {
  Sun: ["Venus", "Saturn"],
  Moon: [],
  Mars: ["Mercury"],
  Mercury: ["Venus"],
  Jupiter: ["Venus", "Saturn"],
  Venus: ["Sun", "Moon"],
  Saturn: ["Sun", "Moon", "Mars"],
  Rahu: ["Sun", "Moon"],
  Ketu: ["Sun", "Moon"],
};

const NAKSHATRA_SPAN = 360 / NAKSHATRA_NAMES.length;

const normalize = (longitude: number): number => ((longitude % 360) + 360) % 360;

export const signOf = (longitude: number): typeof Rashis.Type =>
  RASHI_NAMES[Math.floor(normalize(longitude) / 30)]!;

export const nakshatraOf = (longitude: number): Nakshatra => {
  const position = normalize(longitude);
  const index = Math.floor(position / NAKSHATRA_SPAN);
  const pada = Math.floor(((position % NAKSHATRA_SPAN) / NAKSHATRA_SPAN) * 4) + 1;
  return new Nakshatra({
    name: NAKSHATRA_NAMES[index]!,
    lord: NAKSHATRA_LORD_CYCLE[index % NAKSHATRA_LORD_CYCLE.length]!,
    pada: pada as 1 | 2 | 3 | 4,
  });
};

export const relationWith = (
  planet: typeof Planets.Type,
  lord: typeof Planets.Type,
): "Friend" | "Neutral" | "Enemy" => {
  if (FRIENDS[planet].includes(lord)) return "Friend";
  if (ENEMIES[planet].includes(lord)) return "Enemy";
  return "Neutral";
};

const oppositeSign = (sign: typeof Rashis.Type): typeof Rashis.Type =>
  RASHI_NAMES[(RASHI_NAMES.indexOf(sign) + 6) % 12]!;

export const inSignStatus = (
  planet: typeof Planets.Type,
  sign: typeof Rashis.Type,
): ReadonlyArray<
  "Exalted" | "Moola Trikona" | "Own" | "Friend" | "Neutral" | "Enemy" | "Debilitated"
> => {
  if (EXALTATION[planet] === sign) return ["Exalted"];
  if (oppositeSign(EXALTATION[planet]) === sign) return ["Debilitated"];
  if (MOOLA_TRIKONA[planet] === sign) return ["Moola Trikona"];
  if (OWN_SIGNS[planet].includes(sign)) return ["Own"];
  return [relationWith(planet, SIGN_LORDS[sign])];
};
