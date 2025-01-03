import { existsSync, readdirSync } from "node:fs";
import { defineWorkspace, mergeConfig, ViteUserConfig } from "vitest/config";

const pkgRoot = (pkg: string) =>
  new URL(`./packages/${pkg}`, import.meta.url).pathname;
const alias = (pkg: string) => `${pkgRoot(pkg)}/src`;

const aliases = readdirSync(new URL("./packages", import.meta.url).pathname)
  .filter((dir) => existsSync(pkgRoot(dir) + "/package.json"))
  .filter((dir) => dir !== "uploadthing")
  .reduce<Record<string, string>>(
    (acc, pkg) => {
      acc[`@uploadthing/${pkg}`] = alias(pkg);
      return acc;
    },
    { uploadthing: alias("uploadthing") },
  );

const baseConfig: ViteUserConfig = {
  test: {
    mockReset: true,
    coverage: {
      provider: "v8",
      include: ["**/src/**"],
      exclude: ["**/docs/**", "**/examples/**", "**/tooling/**"],
    },
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
};

export default defineWorkspace([
  mergeConfig(baseConfig, {
    test: {
      include: [
        "**/*.test.{ts,tsx}",
        "!**/*.browser.test.{ts,tsx}",
        "!**/*.e2e.test.{ts,tsx}",
      ],
      name: "unit",
      environment: "node",
    },
  } satisfies ViteUserConfig),
  mergeConfig(baseConfig, {
    test: {
      include: ["**/*.browser.test.{ts,tsx}"],
      name: "browser",
      browser: {
        provider: "playwright",
        enabled: true,
        name: "chromium",
      },
    },
  } satisfies ViteUserConfig),
]);
