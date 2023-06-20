const { execSync } = require("child_process");

/** @type {import("tsup").Options} */
const config = {
  sourcemap: true,
  dts: true,
  format: ["esm"],
  async onSuccess() {
    // emit dts and sourcemaps to enable jump to definition
    execSync("pnpm tsc --project tsconfig.sourcemap.json");
  },
};

module.exports = { config };
