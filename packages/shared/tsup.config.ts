import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: [
    "./src/error.ts",
    "./src/logger.ts",
    "./src/types.ts",
    "./src/utils.ts",
  ],
  clean: !opts.watch,
  async onSuccess() {
    // void
  },
}));
