import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./file-types.ts", "./types.ts", "./utils.ts"],
  clean: !opts.watch,
  async onSuccess() {
    // void
  },
}));
