import * as AstroAscendant from "astro-ascendant";

const exports = Object.keys(AstroAscendant).sort();
if (
  exports.join(",") !==
  "Argala,ArudhaPada,AstroParams,CharaKarakas,Chart,Dasha,Ephemeris,Karakamsha,RashiDrishti,SAV,Upapada,Yoga"
) {
  throw new Error(`Unexpected root exports: ${exports.join(",")}`);
}

await import("astro-ascendant/chart/generate")
  .then(() => {
    throw new Error("Internal chart modules must not be exported");
  })
  .catch((error) => {
    if (error.message === "Internal chart modules must not be exported") throw error;
  });

await import("astro-ascendant/dasha/calculate")
  .then(() => {
    throw new Error("Internal Dasha modules must not be exported");
  })
  .catch((error) => {
    if (error.message === "Internal Dasha modules must not be exported") throw error;
  });

await import("astro-ascendant/sav/calculate")
  .then(() => {
    throw new Error("Internal SAV modules must not be exported");
  })
  .catch((error) => {
    if (error.message === "Internal SAV modules must not be exported") throw error;
  });

const Yoga = await import("astro-ascendant/yoga");
if (Yoga.catalog.length !== 10 || Yoga.catalog[0]?.id !== "gajakesari") {
  throw new Error("The public Yoga catalog is not available from the Yoga subpath");
}
if (
  typeof Yoga.YogaEvaluation !== "function" ||
  typeof Yoga.YogaEvidence !== "function" ||
  typeof Yoga.UnknownYogaError !== "function"
) {
  throw new Error("The public Yoga models and errors are not available from the Yoga subpath");
}

await import("astro-ascendant/yoga/catalog")
  .then(() => {
    throw new Error("Internal Yoga modules must not be exported");
  })
  .catch((error) => {
    if (error.message === "Internal Yoga modules must not be exported") throw error;
  });
