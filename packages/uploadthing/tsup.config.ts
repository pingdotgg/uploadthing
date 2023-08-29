import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: [
    "./src/client.ts",
    "./src/server.ts",
    "./src/next.ts",
    "./src/next-legacy.ts",
    "./src/tw.ts",
    "./src/astro.ts",
  ],
  clean: !opts.watch,
}));
