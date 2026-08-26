import * as AstroAscendant from "astro-ascendant";
import { Equal, HashSet, Record } from "effect";

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
  "RashiDrishti",
  "SAV",
  "Upapada",
  "Yoga",
);
if (!Equal.equals(exports, expectedExports)) {
  throw new Error("Unexpected root exports");
}

const Yoga = await import("astro-ascendant/yoga");
if (typeof Yoga.Yoga !== "function" || typeof Yoga.YogaLayer !== "object") {
  throw new Error("The public Yoga service is not available from the Yoga subpath");
}

const focused = await import("astro-ascendant/chara-karakas");
if (typeof focused.CharaKarakas !== "function" || typeof focused.CharaKarakasLayer !== "object") {
  throw new Error("The focused Jaimini subpath is not available");
}
