import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: {
    sourcemap: true,
    tsconfig: "tsconfig.build.json",
  },
});
