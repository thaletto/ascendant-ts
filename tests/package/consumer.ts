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
  Yoga,
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
import * as FocusedYoga from "astro-ascendant/yoga";

const layers = [
  Argala.ArgalaLayer,
  ArudhaPada.ArudhaPadaLayer,
  CharaKarakas.CharaKarakasLayer,
  Karakamsha.KarakamshaLayer,
  RashiDrishti.RashiDrishtiLayer,
  Upapada.UpapadaLayer,
  FocusedArgala.ArgalaLayer,
  FocusedArudhaPada.ArudhaPadaLayer,
  FocusedCharaKarakas.CharaKarakasLayer,
  FocusedKarakamsha.KarakamshaLayer,
];

void Chart.ChartLayer;
void AstroParams.DefaultAstroParams;
void Ephemeris.Ephemeris;
void Dasha.Dasha;
void FocusedDasha.DashaLayer;
void SAV.SAV;
void FocusedSAV.SAVLayer;
void Yoga.Yoga;
void FocusedYoga.YogaLayer;
void Yoga.YogaEvaluation;
void FocusedYoga.YogaEvidence;
void FocusedYoga.UnknownYogaError;
void DivisionalMapping.getDivisionalTarget;
void Swisseph.SwissephLayer;
void layers;
void FocusedRashiDrishti;
void FocusedUpapada;
