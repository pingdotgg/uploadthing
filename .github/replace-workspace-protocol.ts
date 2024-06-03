/// <reference types="bun" />

import fs from "fs";

export const MODULE = true;

declare module "bun" {
  interface BunFile {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    json(): Promise<any>;
  }
}

const pkgJsonPaths = fs
  .readdirSync("..")
  .filter((dir) => {
    if (!fs.existsSync(`../${dir}/package.json`)) return false;
    const pkg = JSON.parse(fs.readFileSync(`../${dir}/package.json`, "utf-8"));
    return pkg.private !== true;
  })
  .map((dir) => `../${dir}/package.json`);

/**
 * Hack to replace the workspace protocol with the actual version
 */
const packageVersions = {};
await Promise.all(
  pkgJsonPaths.map(async (path) => {
    const pkg = await Bun.file(path).json();
    packageVersions[pkg.name] = pkg.version;
  }),
);

const workspacePkg = await Bun.file("package.json").json();
for (const dep in workspacePkg.dependencies) {
  if (dep in packageVersions) {
    workspacePkg.dependencies[dep] = packageVersions[dep];
  }
}
for (const dep in workspacePkg.peerDependencies) {
  if (dep in packageVersions) {
    workspacePkg.peerDependencies[dep] = packageVersions[dep];
  }
}

// Remove unnecessary fields
workspacePkg.eslintConfig = undefined;
workspacePkg.devDependencies = undefined;
workspacePkg.scripts = undefined;

await Bun.write("package.json", JSON.stringify(workspacePkg, null, 2));
