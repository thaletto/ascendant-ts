import { AstroParams, Chart, Dasha, Ephemeris, SAV } from "astro-ascendant";
import * as DivisionalMapping from "astro-ascendant/chart/divisional-mapping";
import * as FocusedDasha from "astro-ascendant/dasha";
import * as FocusedSAV from "astro-ascendant/sav";
import * as Swisseph from "astro-ascendant/swisseph";

const chartLayer = Chart.layer;
const paramsLayer = AstroParams.defaultLayer;
const ephemerisService = Ephemeris.Service;
const dashaService = Dasha.Service;
const dashaLayer = FocusedDasha.layer;
const savService = SAV.Service;
const savLayer = FocusedSAV.layer;
const mapping = DivisionalMapping.getDivisionalTarget;
const swissephLayer = Swisseph.layer;

void chartLayer;
void paramsLayer;
void ephemerisService;
void dashaService;
void dashaLayer;
void savService;
void savLayer;
void mapping;
void swissephLayer;
