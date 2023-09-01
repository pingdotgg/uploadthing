import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./src/index.tsx"],
  clean: !opts.watch,
}));
