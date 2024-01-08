import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./src/core.ts", "./src/react.tsx", "./src/solid.tsx"],
  external: ["react", "solid-js"],
  clean: !opts.watch,
  async onSuccess() {
    // void
  },
}));
