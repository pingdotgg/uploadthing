import fs from "fs";

const pkgJsonPaths = fs
  .readdirSync("packages")
  .filter((dir) => dir !== "config")
  .map((dir) => `packages/${dir}/package.json`);

try {
  const commitHash = (await new Response(
    Bun.spawn(["git", "rev-parse", "--short", "HEAD"]).stdout
  ).text()).trim();
  console.log(commitHash);

  for (const pkgJsonPath of pkgJsonPaths) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const oldVersion = pkg.version;
    const [major, minor, patch] = oldVersion.split(".").map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}-canary.${commitHash}`;

    pkg.version = newVersion;

    const content = JSON.stringify(pkg, null, "\t") + "\n";
    const newContent = content
      .replace(
        new RegExp(`"@uploadthing/\\*": "${oldVersion}"`, "g"),
        `"@uploadthing/*": "${newVersion}"`,
      )
      .replace(
        new RegExp(`"uploadthing": "${oldVersion}"`, "g"),
        `"uploadthing": "${newVersion}"`,
      );

    fs.writeFileSync(pkgJsonPath, newContent);
  }
  
} catch (error) {
  console.error(error);
  process.exit(1);
}
