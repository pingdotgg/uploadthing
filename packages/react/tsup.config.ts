import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => [
  {
    ...config,
    entry: ["./src/index.ts", "./src/hooks.ts"],
    clean: !opts.watch,
    esbuildOptions: (option) => {
      option.banner = {
        js: `"use client";`,
      };
    },
  },
  {
    entry: ["./src/next-ssr-plugin.tsx"],
    format: ["esm", "cjs"],
    dts: true,
    clean: !opts.watch,
    external: ["react", "next"],
    esbuildOptions: (option) => {
      option.banner = {
        js: `"use client";`,
      };
    },
  },
]);
