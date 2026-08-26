import { Layer } from "effect";

import { Ephemeris } from "../ephemeris/service.js";
import { dateToJulianDay, calculatePosition, calculateHouses } from "./calculate.js";

const layer = Layer.succeed(
  Ephemeris,
  Ephemeris.of({
    dateToJulianDay,
    calculatePosition,
    calculateHouses,
  }),
);

export { layer as SwissephLayer };
