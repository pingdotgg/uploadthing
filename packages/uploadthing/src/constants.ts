import packageJson from "../package.json";

if (!packageJson.version) throw new Error("no version found in package.json");
export const UPLOADTHING_VERSION = packageJson.version;
