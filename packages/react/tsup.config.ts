import { defineConfig } from "tsup";
import { execSync } from "child_process";

export default defineConfig((opts) => ({
  entry: ["./index.ts", "./hooks.ts"],
  splitting: false,
  sourcemap: true,
  clean: !opts.watch,
  dts: true,
  format: ["esm"],
  esbuildOptions: (option) => {
    option.banner = {
      js: `"use client";`,
    };
  },
  // eslint-disable-next-line @typescript-eslint/require-await
  async onSuccess() {
    // emit sourcemap to enable jump to definition
    execSync("pnpm tsc --project tsconfig.sourcemap.json");
  },
}));
