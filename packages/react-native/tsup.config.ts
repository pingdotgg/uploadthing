import { defineConfig } from "tsup";

export default defineConfig((opts) => ({
  entry: ["./index.ts", "./hooks.ts"],
  splitting: false,
  sourcemap: true,
  clean: !opts.watch,
  dts: true,
  format: ["esm"],
  noExternal: ["@uploadthing/shared"],
}));
