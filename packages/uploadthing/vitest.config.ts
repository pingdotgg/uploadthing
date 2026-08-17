import { playwright } from "@vitest/browser-playwright";
import {
  defaultExclude,
  defineConfig,
  defineProject,
  mergeConfig,
} from "vitest/config";

import { baseConfig } from "@uploadthing/vitest-config/base";

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      projects: [
        mergeConfig(
          baseConfig,
          defineProject({
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
          defineProject({
            test: {
              include: ["test/browser/**/*.test.{ts,tsx}"],
              exclude: [...defaultExclude, "test/node/**"],
              name: "browser",
              browser: {
                instances: [{ browser: "chromium" }],
                provider: playwright(),
                enabled: true,
              },
            },
          }),
        ),
      ],
    },
  }),
);
