import { readdirSync } from "fs";
import { defineConfig } from "vitest/config";

const alias = (pkg: string) =>
  new URL(`./packages/${pkg}/src`, import.meta.url).pathname;

const aliases = readdirSync(
  new URL("./packages", import.meta.url).pathname,
).reduce<Record<string, string>>(
  (acc, pkg) => {
    acc[`@uploadthing/${pkg}`] = alias(pkg);
    return acc;
  },
  { uploadthing: alias("uploadthing") },
);

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["**/src/**"],
      exclude: ["**/docs/**", "**/examples/**", "**/tooling/**"],
    },
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
});
