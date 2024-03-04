import { exec, execSync } from "child_process";
import fs from "fs";
import prettier from "@prettier/sync";

const pkgJsonPaths = fs
  .readdirSync("packages")
  .filter((dir) => dir !== "config")
  .map((dir) => `packages/${dir}/package.json`);

try {
  exec("git rev-parse --short HEAD", (err, stdout) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    const commitHash = stdout.trim();

    // First pass to get the new version of everything
    const versions = pkgJsonPaths.reduce((acc, curr) => {
      const pkg = JSON.parse(fs.readFileSync(curr, "utf-8"));
      const oldVersion = pkg.version;
      const [major, minor, patch] = oldVersion.split(".").map(Number);
      const newVersion = `${major}.${minor}.${patch + 1}-canary.${commitHash}`;

      acc[pkg.name] = newVersion;
      return acc;
    }, {})

    for (const pkgJsonPath of pkgJsonPaths) {
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      const oldVersion = pkg.version;
      const newVersion = versions[pkg.name];
    
      pkg.version = newVersion;

      // Update dependencies
      for (const dep in pkg.dependencies) {
        if (versions[dep]) {
          pkg.dependencies[dep] = versions[dep];
        }
      }

      const fmt = prettier.format(JSON.stringify(pkg), { filepath: pkgJsonPath })
      fs.writeFileSync(pkgJsonPath, fmt)
    }
  });
} catch (error) {
  console.error(error);
  process.exit(1);
}
