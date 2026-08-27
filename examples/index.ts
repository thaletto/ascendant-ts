import { BunRuntime } from "@effect/platform-bun";
import {
  Config,
  ConfigProvider,
  Console,
  DateTime,
  Effect,
  FileSystem,
  Match,
  Option,
} from "effect";
import { Prompt } from "effect/unstable/cli";

import { Chart } from "../src/index.ts";
import { chartExample } from "./chart.ts";
import { dashaExample } from "./dasha.ts";
import { jaiminiExample } from "./jaimini.ts";
import { runtimeLayer } from "./runtime.ts";
import { savExample } from "./sav.ts";
import { yogaExample } from "./yoga.ts";

const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ENVIRONMENT_INPUT_ERROR = [
  "Could not load a complete moment from the environment.",
  "Set MOMENT_DATE (an ISO 8601 date and time), LATITUDE (-90 to 90), and LONGITUDE (-180 to 180).",
  "Values are read in this order: process environment, .env.local, .env, then .env.test.",
  "Continue by entering the moment manually.",
].join("\n");
const PRECOMPUTED_LOCATIONS = [
  { name: "Agra", latitude: 27.1767, longitude: 78.0081 },
  { name: "Bangalore", latitude: 12.9716, longitude: 77.5946 },
  { name: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  { name: "Coimbatore", latitude: 11.0168, longitude: 76.9558 },
  { name: "Delhi", latitude: 28.6139, longitude: 77.209 },
  { name: "Kochi", latitude: 9.9312, longitude: 76.2673 },
  { name: "Kolkata", latitude: 22.5726, longitude: 88.3639 },
  { name: "Madurai", latitude: 9.9252, longitude: 78.1198 },
  { name: "Mumbai", latitude: 19.076, longitude: 72.8777 },
  { name: "Pune", latitude: 18.5204, longitude: 73.8567 },
  { name: "Trichy", latitude: 10.7905, longitude: 78.7047 },
] as const;

const TIME_ZONE_CHOICES = ["Asia/Kolkata", "UTC", ...Intl.supportedValuesOf("timeZone")]
  .sort((left, right) => {
    if (left === "Asia/Kolkata") return -1;
    if (right === "Asia/Kolkata") return 1;
    return left.localeCompare(right);
  })
  .map((timeZone) => ({ title: timeZone, value: timeZone }));

function makeMomentFromEnvironment(value: string): Effect.Effect<Chart.Moment, string> {
  return Option.match(DateTime.make(value), {
    onNone: () => Effect.fail("MOMENT_DATE must be a valid ISO 8601 date and time"),
    onSome: (date) => Effect.succeed(Chart.Moment.make({ date })),
  });
}

function validateCoordinate(
  value: number,
  name: "LATITUDE" | "LONGITUDE",
  minimum: number,
  maximum: number,
): Effect.Effect<number, string> {
  return Match.value(value >= minimum && value <= maximum).pipe(
    Match.when(true, () => Effect.succeed(value)),
    Match.when(false, () => Effect.fail(`${name} must be between ${minimum} and ${maximum}`)),
    Match.exhaustive,
  );
}

function validateDate(value: string): Effect.Effect<string, string> {
  return Match.value(DATE_PATTERN.test(value)).pipe(
    Match.when(true, () => Effect.succeed(value)),
    Match.when(false, () => Effect.fail("Enter a date in DD/MM/YYYY format")),
    Match.exhaustive,
  );
}

function validateTime(value: string): Effect.Effect<string, string> {
  return Match.value(TIME_PATTERN.test(value)).pipe(
    Match.when(true, () => Effect.succeed(value)),
    Match.when(false, () => Effect.fail("Enter a 24-hour time in HH:MM format")),
    Match.exhaustive,
  );
}

const promptCoordinates = Effect.fn("Examples.promptCoordinates")(function* () {
  const latitude = yield* Prompt.float({
    message: "Latitude",
    min: -90,
    max: 90,
    precision: 6,
  });
  const longitude = yield* Prompt.float({
    message: "Longitude",
    min: -180,
    max: 180,
    precision: 6,
  });
  return { latitude, longitude };
});

const selectLocation = Effect.fn("Examples.selectLocation")(function* () {
  const location = yield* Prompt.select<
    { readonly latitude: number; readonly longitude: number } | "manual"
  >({
    message: "Location",
    choices: [
      ...PRECOMPUTED_LOCATIONS.map((precomputedLocation) => ({
        title: precomputedLocation.name,
        description: `${precomputedLocation.latitude}, ${precomputedLocation.longitude}`,
        value: {
          latitude: precomputedLocation.latitude,
          longitude: precomputedLocation.longitude,
        },
      })),
      {
        title: "Enter coordinates manually",
        description: "Provide latitude and longitude",
        value: "manual",
      },
    ],
  });
  return yield* Match.value(location).pipe(
    Match.when("manual", () => promptCoordinates()),
    Match.orElse((coordinates) => Effect.succeed(coordinates)),
  );
});

function makeMomentFromInput(
  date: string,
  time: string,
  timeZone: string,
): Effect.Effect<Chart.Moment, string> {
  const localDateTime = `${date.slice(6, 10)}-${date.slice(3, 5)}-${date.slice(0, 2)}T${time}:00`;
  return Option.match(
    DateTime.makeZoned(localDateTime, {
      timeZone,
      adjustForTimeZone: true,
      disambiguation: "reject",
    }),
    {
      onNone: () => Effect.fail("Enter an existing local date and time"),
      onSome: (dateTime) => Effect.succeed(Chart.Moment.make({ date: DateTime.toUtc(dateTime) })),
    },
  );
}

const addDotEnvProvider = Effect.fn("Examples.addDotEnvProvider")(function* (
  provider: ConfigProvider.ConfigProvider,
  path: string,
  exists: boolean,
) {
  return yield* Match.value(exists).pipe(
    Match.when(true, () =>
      ConfigProvider.fromDotEnv({ path }).pipe(
        Effect.map((dotEnv) => ConfigProvider.orElse(dotEnv, provider)),
      ),
    ),
    Match.when(false, () => Effect.succeed(provider)),
    Match.exhaustive,
  );
});

const environmentConfigProvider = Effect.fn("Examples.environmentConfigProvider")(function* () {
  const fileSystem = yield* FileSystem.FileSystem;
  const hasDotEnv = yield* fileSystem.exists(".env");
  const hasDotEnvLocal = yield* fileSystem.exists(".env.local");
  const hasDotEnvTest = yield* fileSystem.exists(".env.test");

  const withDotEnvTest = yield* addDotEnvProvider(
    ConfigProvider.fromUnknown({}),
    ".env.test",
    hasDotEnvTest,
  );
  const withDotEnv = yield* addDotEnvProvider(withDotEnvTest, ".env", hasDotEnv);
  const withDotEnvLocal = yield* addDotEnvProvider(withDotEnv, ".env.local", hasDotEnvLocal);

  return ConfigProvider.orElse(ConfigProvider.fromEnv(), withDotEnvLocal);
});

const inputFromEnvironment = Effect.fn("Examples.inputFromEnvironment")(function* () {
  const provider = yield* environmentConfigProvider();
  const date = yield* Config.string("MOMENT_DATE").parse(provider);
  const latitude = yield* Config.number("LATITUDE").parse(provider);
  const longitude = yield* Config.number("LONGITUDE").parse(provider);
  const moment = yield* makeMomentFromEnvironment(date);
  const validLatitude = yield* validateCoordinate(latitude, "LATITUDE", -90, 90);
  const validLongitude = yield* validateCoordinate(longitude, "LONGITUDE", -180, 180);
  return { moment, latitude: validLatitude, longitude: validLongitude };
});

const promptInput = Effect.fn("Examples.promptInput")(function* () {
  const date = yield* Prompt.text({
    message: "Date (DD/MM/YYYY)",
    validate: validateDate,
  });
  const time = yield* Prompt.text({
    message: "Time (24-hour HH:MM)",
    validate: validateTime,
  });
  const timeZone = yield* Prompt.autoComplete<string>({
    message: "Timezone",
    filterLabel: "Search timezone",
    filterPlaceholder: "Type a city or region",
    choices: TIME_ZONE_CHOICES,
  });
  const moment = yield* makeMomentFromInput(date, time, timeZone);
  const coordinates = yield* selectLocation();
  return { moment, ...coordinates };
});

const selectInput = Effect.fn("Examples.selectInput")(function* () {
  const source = yield* Prompt.select<"environment" | "input">({
    message: "How would you like to provide the moment?",
    choices: [
      {
        title: "Read from environment",
        description: "Use process variables, .env.local, .env, or .env.test",
        value: "environment",
      },
      {
        title: "Enter manually",
        description: "Provide date, time, timezone, and coordinates interactively",
        value: "input",
      },
    ],
  });
  return yield* Match.value(source).pipe(
    Match.when("environment", () =>
      inputFromEnvironment().pipe(
        Effect.catch(() =>
          Effect.gen(function* () {
            yield* Console.error(ENVIRONMENT_INPUT_ERROR);
            return yield* promptInput();
          }),
        ),
      ),
    ),
    Match.orElse(() => promptInput()),
  );
});

const runSelectedExample = Effect.fn("Examples.runSelectedExample")(function* () {
  const input = yield* selectInput();
  const example = yield* Prompt.select<"chart" | "dasha" | "jaimini" | "sav" | "yoga">({
    message: "Choose an example to run",
    choices: [
      {
        title: "Chart",
        description: "Generate and print the D1 and D9 charts",
        value: "chart",
      },
      {
        title: "Dasha",
        description: "Calculate and print the Vimshottari Dasha timeline",
        value: "dasha",
      },
      {
        title: "Jaimini",
        description: "Calculate the named Jaimini results",
        value: "jaimini",
      },
      {
        title: "SAV",
        description: "Calculate Bhinnashtakavarga and Sarvashtakavarga",
        value: "sav",
      },
      {
        title: "Yoga",
        description: "Evaluate the Yoga catalog",
        value: "yoga",
      },
    ],
  });

  yield* Match.value(example).pipe(
    Match.when("chart", () => chartExample(input)),
    Match.when("dasha", () => dashaExample(input)),
    Match.when("jaimini", () => jaiminiExample(input)),
    Match.when("sav", () => savExample(input)),
    Match.when("yoga", () => yogaExample(input)),
    Match.exhaustive,
  );
});

const examples = runSelectedExample().pipe(
  Effect.provide(runtimeLayer),
  Effect.catchTag("QuitError", () => Effect.void),
);

BunRuntime.runMain(examples);
