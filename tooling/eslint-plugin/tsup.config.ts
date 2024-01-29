import { defineConfig } from "tsup";

export default defineConfig((opts) => ({
  entry: ["src/index.ts"],
  format: ["cjs"],
  clean: !opts.watch,
  minify: !opts.watch,
}));
