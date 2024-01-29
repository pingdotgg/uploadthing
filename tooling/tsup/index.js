const { execSync } = require("child_process");

/** @type {import("tsup").Options} */
const config = {
  sourcemap: true,
  dts: true,
  format: ["esm", "cjs"],
};

module.exports = { config };
