import { defineConfig, mergeConfig } from "vitest/config";

import { baseConfig } from "@uploadthing/vitest-config/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {},
  }),
);
