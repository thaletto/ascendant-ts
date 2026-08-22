import { AstroParams, Chart, Dasha, Ephemeris } from "astro-ascendant";
import * as DivisionalMapping from "astro-ascendant/chart/divisional-mapping";
import * as FocusedDasha from "astro-ascendant/dasha";
import * as Swisseph from "astro-ascendant/swisseph";

const chartLayer = Chart.layer;
const paramsLayer = AstroParams.defaultLayer;
const ephemerisService = Ephemeris.Service;
const dashaService = Dasha.Service;
const dashaLayer = FocusedDasha.layer;
const mapping = DivisionalMapping.getDivisionalTarget;
const swissephLayer = Swisseph.layer;

void chartLayer;
void paramsLayer;
void ephemerisService;
void dashaService;
void dashaLayer;
void mapping;
void swissephLayer;
