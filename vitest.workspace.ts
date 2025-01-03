import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    extends: "./vitest.config.ts",
    test: {
      include: [
        "**/*.test.{ts,tsx}",
        "!**/*.browser.test.{ts,tsx}",
        "!**/*.e2e.test.{ts,tsx}",
      ],
      name: "unit",
      environment: "node",
    },
  },
  {
    extends: "./vitest.config.ts",
    test: {
      include: ["**/*.browser.test.{ts,tsx}"],
      name: "browser",
      browser: {
        provider: "playwright",
        enabled: true,
        name: "chromium",
      },
    },
  },
]);
