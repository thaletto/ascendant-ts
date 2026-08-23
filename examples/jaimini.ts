import { Config, Console, Effect, Layer } from "effect";
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
import * as Swisseph from "../src/swisseph/index.ts";

const config = Effect.gen(function* () {
  const date = yield* Config.string("MOMENT_DATE");
  const latitude = yield* Config.number("LATITUDE");
  const longitude = yield* Config.number("LONGITUDE");
  return { date, latitude, longitude };
});

const program = Effect.gen(function* () {
  const { date, latitude, longitude } = yield* config;
  const chart = yield* Chart.Service;
  const charaKarakas = yield* CharaKarakas.Service;
  const rashiDrishti = yield* RashiDrishti.Service;
  const karakamsha = yield* Karakamsha.Service;
  const arudhaPada = yield* ArudhaPada.Service;
  const upapada = yield* Upapada.Service;
  const argala = yield* Argala.Service;

  const calculation = yield* chart.generate(
    new Chart.LocatedMoment({
      moment: new Chart.Moment({ date: new Date(date) }),
      latitude,
      longitude,
    }),
    [9],
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

const chartLayer = Chart.layer.pipe(
  Layer.provide(AstroParams.defaultLayer),
  Layer.provide(Swisseph.layer),
);
const runtimeLayer = Layer.mergeAll(
  chartLayer,
  CharaKarakas.layer,
  RashiDrishti.layer,
  Karakamsha.layer,
  ArudhaPada.layer,
  Upapada.layer,
  Argala.layer,
  DevTools.layer(),
);

Effect.runPromise(program.pipe(Effect.provide(runtimeLayer))).catch((error) => {
  console.error(error);
});
