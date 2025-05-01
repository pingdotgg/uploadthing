import { defineConfig, mergeConfig } from "vitest/config";

import { baseConfig } from "@uploadthing/vitest-config/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: "browser",
      browser: {
        instances: [{ browser: "chromium" }],
        provider: "playwright",
        enabled: true,
      },
    },
    optimizeDeps: {
      include: ["react/jsx-dev-runtime"],
    },
  }),
);
