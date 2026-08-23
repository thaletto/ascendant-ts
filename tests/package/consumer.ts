import {
  Argala,
  ArudhaPada,
  AstroParams,
  Chart,
  CharaKarakas,
  Dasha,
  Ephemeris,
  Karakamsha,
  RashiDrishti,
  SAV,
  Upapada,
} from "astro-ascendant";
import * as FocusedArgala from "astro-ascendant/argala";
import * as FocusedArudhaPada from "astro-ascendant/arudha-pada";
import * as FocusedCharaKarakas from "astro-ascendant/chara-karakas";
import * as DivisionalMapping from "astro-ascendant/chart/divisional-mapping";
import * as FocusedDasha from "astro-ascendant/dasha";
import * as FocusedKarakamsha from "astro-ascendant/karakamsha";
import * as FocusedRashiDrishti from "astro-ascendant/rashi-drishti";
import * as FocusedSAV from "astro-ascendant/sav";
import * as Swisseph from "astro-ascendant/swisseph";
import * as FocusedUpapada from "astro-ascendant/upapada";

const chartLayer = Chart.layer;
const paramsLayer = AstroParams.defaultLayer;
const ephemerisService = Ephemeris.Service;
const dashaService = Dasha.Service;
const dashaLayer = FocusedDasha.layer;
const savService = SAV.Service;
const savLayer = FocusedSAV.layer;
const mapping = DivisionalMapping.getDivisionalTarget;
const swissephLayer = Swisseph.layer;
const bhavaSchema = Chart.BhavaChart;
const circleAngleSchema = Chart.CircleAngle;
const ayanamsas = AstroParams.Ayanamsa.literals;
const houseSystems = AstroParams.HouseSystem.literals;
const namedCalculationLayers = [
  Argala.layer,
  ArudhaPada.layer,
  CharaKarakas.layer,
  Karakamsha.layer,
  RashiDrishti.layer,
  Upapada.layer,
  FocusedArgala.layer,
  FocusedArudhaPada.layer,
  FocusedCharaKarakas.layer,
  FocusedKarakamsha.layer,
  FocusedRashiDrishti.layer,
  FocusedUpapada.layer,
];

void chartLayer;
void paramsLayer;
void ephemerisService;
void dashaService;
void dashaLayer;
void savService;
void savLayer;
void mapping;
void swissephLayer;
void bhavaSchema;
void circleAngleSchema;
void ayanamsas;
void houseSystems;
void namedCalculationLayers;
