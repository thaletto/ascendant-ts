import { BunRuntime } from "@effect/platform-bun";
import { Config, Console, DateTime, Effect, Layer } from "effect";
import { DevTools } from "effect/unstable/devtools";

import {
  Argala,
  ArudhaPada,
  AstroParams,
  Chart,
  CharaKarakas,
  Karakamsha,
  RashiDrishti,
  Upapada,
} from "../src/index.ts";
import { LocatedMoment, Moment } from "../src/internal/model.ts";
import * as Swisseph from "../src/swisseph/index.ts";

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const program = Effect.gen(function* () {
  const { date, latitude, longitude } = yield* config;
  const chart = yield* Chart.Chart;
  const charaKarakas = yield* CharaKarakas.CharaKarakas;
  const rashiDrishti = yield* RashiDrishti.RashiDrishti;
  const karakamsha = yield* Karakamsha.Karakamsha;
  const arudhaPada = yield* ArudhaPada.ArudhaPada;
  const upapada = yield* Upapada.Upapada;
  const argala = yield* Argala.Argala;

  const calculation = yield* chart.generate(
    LocatedMoment.make({
      moment: Moment.make({ date: DateTime.makeUnsafe(date) }),
      latitude,
      longitude,
    }),
    [1, 9],
  );
  const placements = calculation.placements;
  const lagnaSign = calculation.charts[0].houses[1].sign;

  const charaKarakaResult = yield* charaKarakas.calculate(placements);
  const rashiDrishtiResult = yield* rashiDrishti.calculate(lagnaSign);
  const karakamshaResult = yield* karakamsha.calculate(placements);
  const arudhaLagnaResult = yield* arudhaPada.calculate(placements, 1);
  const upapadaResult = yield* upapada.calculate(placements);
  const argalaResult = yield* argala.calculate(placements, {
    kind: "Sign",
    sign: lagnaSign,
  });

  yield* Console.log("Chara Karakas");
  yield* Console.table(
    CharaKarakas.Roles.literals.map((role) => ({
      Role: role,
      Planet: charaKarakaResult.assignments[role].map(({ planet }) => planet).join(", "),
      Degree: charaKarakaResult.assignments[role].map(({ degree }) => `${degree}°`).join(", "),
    })),
  );

  yield* Console.log("Named sign results");
  yield* Console.table([
    {
      Calculation: "Rashi Drishti from D1 Lagna",
      Result: rashiDrishtiResult.targets.join(", "),
    },
    {
      Calculation: "Karakamsha",
      Result: karakamshaResult.placements
        .map(({ planet, sign }) => `${planet}: ${sign}`)
        .join(", "),
    },
    { Calculation: "Arudha Lagna (A1)", Result: arudhaLagnaResult.sign },
    { Calculation: "Upapada (A12)", Result: upapadaResult.sign },
  ]);

  yield* Console.log(`Argala from ${argalaResult.referenceSign}`);
  yield* Console.table([
    ...argalaResult.supporting.map((relation) => ({
      Kind: "Supporting",
      Position: relation.position,
      Sign: relation.sign,
      Planets: relation.planets.join(", "),
    })),
    ...argalaResult.obstructing.map((relation) => ({
      Kind: "Obstructing",
      Position: relation.position,
      Sign: relation.sign,
      Planets: relation.planets.join(", "),
    })),
    {
      Kind: "Secondary supporting",
      Position: argalaResult.secondarySupporting.position,
      Sign: argalaResult.secondarySupporting.sign,
      Planets: argalaResult.secondarySupporting.planets.join(", "),
    },
    {
      Kind: "Secondary obstructing",
      Position: argalaResult.secondaryObstructing.position,
      Sign: argalaResult.secondaryObstructing.sign,
      Planets: argalaResult.secondaryObstructing.planets.join(", "),
    },
  ]);
});

const runtimeLayer = Layer.mergeAll(
  AstroParams.DefaultAstroParams,
  Chart.ChartLayer,
  CharaKarakas.CharaKarakasLayer,
  RashiDrishti.RashiDrishtiLayer,
  Karakamsha.KarakamshaLayer,
  ArudhaPada.ArudhaPadaLayer,
  Upapada.UpapadaLayer,
  Argala.ArgalaLayer,
  Swisseph.SwissephLayer,
  DevTools.layer(),
);

BunRuntime.runMain(program.pipe(Effect.provide(runtimeLayer)));
