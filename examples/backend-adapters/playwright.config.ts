import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./test",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://localhost:5173",
    headless: !!process.env.CI,
  },
  webServer: [
    {
      command: "pnpm dev:hono",
      url: "http://localhost:3000/api",
      reuseExistingServer: !process.env.CI,
      stdout: "pipe",
      stderr: "pipe",
    },
  ],
});
