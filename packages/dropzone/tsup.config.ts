import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./src/core.ts", "./src/react.tsx"],
  external: ["react"],
  clean: !opts.watch,
  async onSuccess() {
    // void
  },
}));
