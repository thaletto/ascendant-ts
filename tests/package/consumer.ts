import { AstroParams, Chart, Ephemeris } from "astro-ascendant";
import * as DivisionalMapping from "astro-ascendant/chart/divisional-mapping";
import * as Swisseph from "astro-ascendant/swisseph";

const chartLayer = Chart.layer;
const paramsLayer = AstroParams.defaultLayer;
const ephemerisService = Ephemeris.Service;
const mapping = DivisionalMapping.getDivisionalTarget;
const swissephLayer = Swisseph.layer;

void chartLayer;
void paramsLayer;
void ephemerisService;
void mapping;
void swissephLayer;
