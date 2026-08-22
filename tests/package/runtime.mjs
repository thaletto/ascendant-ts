import * as AstroAscendant from "astro-ascendant";

const exports = Object.keys(AstroAscendant).sort();
if (exports.join(",") !== "AstroParams,Chart,Dasha,Ephemeris,SAV") {
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
