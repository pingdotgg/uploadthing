import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./index.ts", "./hooks.ts"],
  clean: !opts.watch,
  noExternal: ["@uploadthing/shared"],
}));
