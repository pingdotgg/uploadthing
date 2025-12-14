import { playwright } from "@vitest/browser-playwright";
import {
  defaultExclude,
  defineConfig,
  mergeConfig,
  ViteUserConfig,
} from "vitest/config";

import { baseConfig } from "@uploadthing/vitest-config/base";

export default mergeConfig(baseConfig, {
  test: {
    projects: [
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
              provider: playwright(),
              enabled: true,
            },
          },
        }),
      ),
    ],
  },
} satisfies ViteUserConfig);
