import * as AstroAscendant from "astro-ascendant";
import { Array, Equal, HashSet, Record } from "effect";

const exports = HashSet.fromIterable(Record.keys(AstroAscendant));
const expectedExports = HashSet.make(
  "Argala",
  "ArudhaPada",
  "AstroParams",
  "Chart",
  "CharaKarakas",
  "Dasha",
  "Ephemeris",
  "Karakamsha",
  "Provenance",
  "RashiDrishti",
  "SAV",
  "Upapada",
  "Yoga",
);
if (!Equal.equals(exports, expectedExports)) {
  throw new Error("Unexpected root exports");
}

const Yoga = await import("astro-ascendant/yoga");
if (typeof Yoga.evaluateAll !== "function" || !Array.isArray(Yoga.catalog)) {
  throw new Error("The public Yoga interface is not available from the Yoga subpath");
}

const focused = await import("astro-ascendant/chara-karakas");
if (typeof focused.calculate !== "function") {
  throw new Error("The focused Jaimini subpath is not available");
}

const provenance = await import("astro-ascendant/provenance");
if (provenance.methods.sthiraDasha?.provenance.method !== "bv-raman-koch-brahma-strength") {
  throw new Error("The focused provenance registry is not available");
}

const dasha = await import("astro-ascendant/dasha");
if (
  typeof dasha.calculate !== "function" ||
  typeof dasha.at !== "function" ||
  typeof dasha.calculateChara !== "function" ||
  typeof dasha.calculateSthira !== "function" ||
  typeof dasha.atRashi !== "function"
) {
  throw new Error("The focused Dasha interface is not available");
}
