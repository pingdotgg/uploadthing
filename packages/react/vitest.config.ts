import { playwright } from "@vitest/browser-playwright";
import { mergeConfig, ViteUserConfig } from "vitest/config";

import { baseConfig } from "@uploadthing/vitest-config/base";

export default mergeConfig(baseConfig, {
  test: {
    name: "browser",
    browser: {
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      enabled: true,
    },
  },
  optimizeDeps: {
    include: ["react/jsx-dev-runtime"],
  },
} satisfies ViteUserConfig);
