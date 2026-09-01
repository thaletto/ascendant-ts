import { Schema } from "effect";

/** A versioned, externally observable calculation identity. */
export const CalculationProvenance = Schema.Struct({
  school: Schema.String,
  method: Schema.String,
  version: Schema.Union([Schema.String, Schema.Int]),
});
export interface CalculationProvenance extends Schema.Schema.Type<typeof CalculationProvenance> {}

export const MethodStep = Schema.Struct({
  id: Schema.String,
  description: Schema.String,
});
export interface MethodStep extends Schema.Schema.Type<typeof MethodStep> {}

export const MethodSpecification = Schema.Struct({
  provenance: CalculationProvenance,
  steps: Schema.NonEmptyArray(MethodStep),
  verification: Schema.NonEmptyArray(Schema.String),
});
export interface MethodSpecification extends Schema.Schema.Type<typeof MethodSpecification> {}

export const ChartProjectionProvenance = Schema.Struct({
  school: Schema.Literal("Ascendant"),
  method: Schema.Literal("ascendant-divisional-mapping"),
  version: Schema.Literal("1"),
});
export interface ChartProjectionProvenance extends Schema.Schema.Type<
  typeof ChartProjectionProvenance
> {}

export const YogaProvenance = Schema.Struct({
  school: Schema.Literal("Parashari"),
  method: Schema.Literal("ascendant-yoga"),
  version: Schema.Literal("v1"),
});
export interface YogaProvenance extends Schema.Schema.Type<typeof YogaProvenance> {}

export const JaiminiArgalaProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("structural-positions"),
  version: Schema.Literal(1),
});
export interface JaiminiArgalaProvenance extends Schema.Schema.Type<
  typeof JaiminiArgalaProvenance
> {}

export const JaiminiArudhaPadaProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("plain-projection"),
  version: Schema.Literal(1),
});
export interface JaiminiArudhaPadaProvenance extends Schema.Schema.Type<
  typeof JaiminiArudhaPadaProvenance
> {}

export const JaiminiCharaKarakasProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("exact-degree-shared-roles"),
  version: Schema.Literal(1),
});
export interface JaiminiCharaKarakasProvenance extends Schema.Schema.Type<
  typeof JaiminiCharaKarakasProvenance
> {}

export const JaiminiKarakamshaProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("atmakaraka-d9-sign"),
  version: Schema.Literal(1),
});
export interface JaiminiKarakamshaProvenance extends Schema.Schema.Type<
  typeof JaiminiKarakamshaProvenance
> {}

export const JaiminiRashiDrishtiProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("movable-fixed-dual"),
  version: Schema.Literal(1),
});
export interface JaiminiRashiDrishtiProvenance extends Schema.Schema.Type<
  typeof JaiminiRashiDrishtiProvenance
> {}

export const JaiminiUpapadaProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("twelfth-house-plain-projection"),
  version: Schema.Literal(1),
});
export interface JaiminiUpapadaProvenance extends Schema.Schema.Type<
  typeof JaiminiUpapadaProvenance
> {}

export const CharaDashaProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("kn-rao-co-lord-strength"),
  version: Schema.Literal(2),
});
export interface CharaDashaProvenance extends Schema.Schema.Type<typeof CharaDashaProvenance> {}

export const SthiraDashaProvenance = Schema.Struct({
  school: Schema.Literal("Jaimini"),
  method: Schema.Literal("bv-raman-koch-brahma-strength"),
  version: Schema.Literal(2),
});
export interface SthiraDashaProvenance extends Schema.Schema.Type<typeof SthiraDashaProvenance> {}

/**
 * The canonical registry of calculation methods. Results carry the matching
 * `provenance`; this registry supplies the auditable method steps and checks.
 */
export const methods = {
  chartProjection: {
    provenance: { school: "Ascendant", method: "ascendant-divisional-mapping", version: "1" },
    steps: [
      { id: "map-longitudes", description: "Map Lagna and planets into the requested division." },
      { id: "build-whole-sign-houses", description: "Build twelve houses from the mapped Lagna." },
    ],
    verification: ["D1 is an identity projection.", "Requested divisions are unique and ordered."],
  },
  yoga: {
    provenance: { school: "Parashari", method: "ascendant-yoga", version: "v1" },
    steps: [
      {
        id: "select-rules",
        description: "Select the requested yoga definitions in catalogue order.",
      },
      {
        id: "evaluate-evidence",
        description: "Evaluate each definition against chart-house evidence.",
      },
    ],
    verification: [
      "Every result includes matched evidence.",
      "Selected results preserve caller order.",
    ],
  },
  jaiminiArgala: {
    provenance: { school: "Jaimini", method: "structural-positions", version: 1 },
    steps: [
      { id: "validate-placements", description: "Require one placement for every planet." },
      {
        id: "derive-relations",
        description: "Calculate supporting and obstructing sign positions.",
      },
    ],
    verification: [
      "Ketu reference reverses direction.",
      "Supporting and obstructing positions are fixed.",
    ],
  },
  jaiminiArudhaPada: {
    provenance: { school: "Jaimini", method: "plain-projection", version: 1 },
    steps: [
      {
        id: "derive-source",
        description: "Find the source sign and its lord for the requested house.",
      },
      { id: "project", description: "Project the lord's distance from the source sign." },
    ],
    verification: ["Exactly one placement is required for the house lord."],
  },
  jaiminiCharaKarakas: {
    provenance: { school: "Jaimini", method: "exact-degree-shared-roles", version: 1 },
    steps: [
      { id: "rank", description: "Rank classical planets by exact degree within their signs." },
      { id: "assign", description: "Assign Karaka roles, sharing every role at an exact tie." },
    ],
    verification: [
      "All seven classical planet placements are required.",
      "Exact ties share roles.",
    ],
  },
  jaiminiKarakamsha: {
    provenance: { school: "Jaimini", method: "atmakaraka-d9-sign", version: 1 },
    steps: [
      { id: "select-atmakaraka", description: "Use the Chara Karaka Atmakaraka assignment." },
      { id: "map-d9", description: "Map each Atmakaraka to its D9 sign." },
    ],
    verification: ["Every tied Atmakaraka is reported."],
  },
  jaiminiRashiDrishti: {
    provenance: { school: "Jaimini", method: "movable-fixed-dual", version: 1 },
    steps: [
      {
        id: "classify-reference",
        description: "Classify the reference sign as movable, fixed, or dual.",
      },
      { id: "derive-targets", description: "Return the three signs receiving its Rashi Drishti." },
    ],
    verification: ["Every reference sign has exactly three targets."],
  },
  jaiminiUpapada: {
    provenance: { school: "Jaimini", method: "twelfth-house-plain-projection", version: 1 },
    steps: [
      { id: "fix-house", description: "Use the twelfth house as the Arudha source." },
      { id: "project", description: "Apply the plain Arudha projection to that source." },
    ],
    verification: ["The result always reports house twelve."],
  },
  charaDasha: {
    provenance: { school: "Jaimini", method: "kn-rao-co-lord-strength", version: 2 },
    steps: [
      { id: "derive-direction", description: "Set direction from the ninth sign's pada group." },
      {
        id: "resolve-co-lords",
        description:
          "Resolve Scorpio and Aquarius co-lords by occupation, association count, and exact degree.",
      },
      { id: "build-periods", description: "Build sign periods and equal-twelfth antardashas." },
    ],
    verification: [
      "All twelve sign periods are contiguous.",
      "Scorpio and Aquarius co-lord resolution is deterministic.",
    ],
  },
  sthiraDasha: {
    provenance: { school: "Jaimini", method: "bv-raman-koch-brahma-strength", version: 2 },
    steps: [
      { id: "select-reference", description: "Compare Lagna and seventh-sign Rashi Bala." },
      {
        id: "select-brahma",
        description: "Score eligible sixth, eighth, and twelfth lords by Graha Bala.",
      },
      {
        id: "build-periods",
        description: "Start at Brahma's sign and assign 7, 8, or 9 years by modality.",
      },
    ],
    verification: [
      "Brahma scorecards expose all candidate scores.",
      "Exact-degree then natural-strength breaks score ties.",
    ],
  },
} as const satisfies Record<string, MethodSpecification>;

export type MethodId = keyof typeof methods;
