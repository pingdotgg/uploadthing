import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: [
    "./src/core.ts",
    "./src/react.tsx",
    "./src/solid.tsx",
    "./src/vue.ts",
  ],
  external: ["react", "solid-js", "vue"],
  clean: !opts.watch,
  async onSuccess() {
    // void
  },
}));
