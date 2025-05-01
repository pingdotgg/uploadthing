import { defaultExclude, defineConfig, mergeConfig } from "vitest/config";

import { baseConfig } from "@uploadthing/vitest-config/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      workspace: [
        mergeConfig(
          baseConfig,
          defineConfig({
            test: {
              include: ["test/node/**/*.test.{ts,tsx}"],
              exclude: [...defaultExclude, "test/browser/**"],
              name: "unit",
              environment: "node",
            },
          }),
        ),
        mergeConfig(
          baseConfig,
          defineConfig({
            test: {
              include: ["test/browser/**/*.test.{ts,tsx}"],
              exclude: [...defaultExclude, "test/node/**"],
              name: "browser",
              browser: {
                instances: [{ browser: "chromium" }],
                provider: "playwright",
                enabled: true,
              },
            },
          }),
        ),
      ],
    },
  }),
);
