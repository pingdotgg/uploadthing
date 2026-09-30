import { existsSync, readdirSync } from "fs";

/**
 *
 * @param {string} pkg
 * @returns
 */
const pkgRoot = (pkg) =>
  new URL(`../../../packages${pkg ? `/${pkg}` : ""}`, import.meta.url).pathname;

/**
 *
 * @param {string} pkg
 * @returns
 */
const alias = (pkg) => `${pkgRoot(pkg)}/src`;

const aliases = readdirSync(pkgRoot(""))
  .filter((dir) => existsSync(pkgRoot(dir) + "/package.json"))
  .filter((dir) => dir !== "uploadthing")
  .reduce(
    (acc, pkg) => {
      acc[`@uploadthing/${pkg}`] = alias(pkg);
      return acc;
    },
    /** @type {Record<string, string>} */ ({
      uploadthing: alias("uploadthing"),
    }),
  );

/** @type {import("vitest/config").ViteUserConfig} */
export const baseConfig = {
  test: {
    silent: "passed-only",
    mockReset: true,
    setupFiles: [new URL("./setup-effect.js", import.meta.url).pathname],
    coverage: {
      provider: "istanbul",
      reporter: [
        [
          "json",
          {
            file: "../coverage.json",
          },
        ],
      ],
      enabled: true,
    },
  },
  resolve: { alias: aliases },
};
