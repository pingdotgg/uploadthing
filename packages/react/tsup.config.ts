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
    ...config,
    entry: ["./src/next-ssr-plugin.tsx"],
    clean: !opts.watch,
  }
]);
