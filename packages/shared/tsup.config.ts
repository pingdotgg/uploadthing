import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./file-types.ts", "./classnames"],
  clean: !opts.watch,
  async onSuccess() {
    // void
  },
}));
