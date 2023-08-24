import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./src/index.ts", "./src/db.ts"],
  clean: !opts.watch,
  async onSuccess() {
    // void
  },
  format: ["cjs", "esm"],
}));
