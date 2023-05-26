import type { PackageJson } from "type-fest";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require("../../package.json") as PackageJson;
if (!packageJson.version) throw new Error("no version found in package.json");
export const UPLOADTHING_VERSION = packageJson.version;
