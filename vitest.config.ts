import { existsSync, readdirSync } from "fs";
import { defineConfig } from "vitest/config";

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

export default defineConfig({
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
});
