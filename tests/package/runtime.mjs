import * as AstroAscendant from "astro-ascendant";

const exports = Object.keys(AstroAscendant).sort();
if (exports.join(",") !== "AstroParams,Chart,Ephemeris") {
  throw new Error(`Unexpected root exports: ${exports.join(",")}`);
}

await import("astro-ascendant/chart/generate")
  .then(() => {
    throw new Error("Internal chart modules must not be exported");
  })
  .catch((error) => {
    if (error.message === "Internal chart modules must not be exported") throw error;
  });
