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
import { DateTime, Effect } from "effect";

const moment = Chart.Moment.make({
  date: DateTime.makeUnsafe("2000-01-01T12:00:00.000Z"),
});
const input = Chart.LocatedMoment.make({
  moment,
  latitude: 12.9716,
  longitude: 77.5946,
});

const packageWorkflow = Effect.gen(function* () {
  const calculation = yield* Chart.generate(input, [9]);
  const timeline = yield* Dasha.calculate(moment, calculation.placements);
  const current = yield* Dasha.at(timeline, moment.date);
  const chara = yield* Dasha.calculateChara(moment, calculation.placements);
  const sthira = yield* Dasha.calculateSthira(moment, calculation.placements);
  const currentRashi = yield* Dasha.atRashi(chara, moment.date);
  const sav = yield* SAV.calculate(calculation.placements);
  const yogas = yield* Yoga.evaluateAll(calculation);
  const charaKarakas = yield* CharaKarakas.calculate(calculation.placements);

  return { calculation, timeline, current, chara, sthira, currentRashi, sav, yogas, charaKarakas };
});

void Chart.generate;
void Chart.project;
void Chart.ChartCalculation;
void Chart.LocatedMoment;
void Chart.Moment;
void AstroParams.layer;
void AstroParams.DefaultAstroParams;
void Ephemeris.Ephemeris;
void Dasha.calculate;
void Dasha.at;
void Dasha.calculateChara;
void Dasha.calculateSthira;
void Dasha.atRashi;
void FocusedDasha.calculate;
void FocusedDasha.at;
void FocusedDasha.calculateChara;
void FocusedDasha.calculateSthira;
void FocusedDasha.atRashi;
void FocusedDasha.CharaDasha;
void FocusedDasha.SthiraDasha;
void SAV.calculate;
void FocusedSAV.calculate;
void Yoga.catalog;
void Yoga.evaluateAll;
void Yoga.evaluateSelected;
void FocusedYoga.YogaEvidence;
void FocusedYoga.UnknownYogaError;
void Argala.calculate;
void ArudhaPada.calculate;
void CharaKarakas.calculate;
void Karakamsha.calculate;
void RashiDrishti.calculate;
void Upapada.calculate;
void FocusedArgala.calculate;
void FocusedArudhaPada.calculate;
void FocusedCharaKarakas.calculate;
void FocusedKarakamsha.calculate;
void FocusedRashiDrishti.calculate;
void FocusedUpapada.calculate;
void DivisionalMapping.getDivisionalTarget;
void Swisseph.SwissephLayer;
void packageWorkflow;
