// @ts-check

import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as utils from "node:util";
import { context, getOctokit } from "@actions/github";
import prettier from "@prettier/sync";

const execa = utils.promisify(cp.exec);

const pkgJsonPaths = fs
  .readdirSync("packages")
  .filter((dir) => fs.existsSync(`packages/${dir}/package.json`))
  .filter((dir) => {
    if (!fs.existsSync(`packages/${dir}/package.json`)) return false;
    const pkg = JSON.parse(
      fs.readFileSync(`packages/${dir}/package.json`, "utf-8"),
    );
    return pkg.private !== true;
  })
  .map((dir) => `packages/${dir}/package.json`);

async function version() {
  const { stdout } = await execa("git rev-parse --short HEAD");
  const commitHash = stdout.trim();

  // First pass to get the new version of everything
  const versions = pkgJsonPaths.reduce((acc, curr) => {
    const pkg = JSON.parse(fs.readFileSync(curr, "utf-8"));
    const oldVersion = pkg.version;
    const [major, minor, patch] = oldVersion.split(".").map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}-canary.${commitHash}`;

    acc[pkg.name] = newVersion;
    return acc;
  }, {});

  for (const pkgJsonPath of pkgJsonPaths) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    pkg.version = versions[pkg.name];

    // Update dependencies
    for (const dep in pkg.dependencies) {
      if (versions[dep] && pkg.dependencies[dep].startsWith("workspace:")) {
        pkg.dependencies[dep] = versions[dep];
      }
    }
    for (const dep in pkg.peerDependencies) {
      if (versions[dep] && pkg.peerDependencies[dep].startsWith("workspace:")) {
        pkg.peerDependencies[dep] = versions[dep];
      }
    }

    const fmt = prettier.format(JSON.stringify(pkg), { filepath: pkgJsonPath });
    fs.writeFileSync(pkgJsonPath, fmt);
  }
}

async function publish() {
  await Promise.allSettled(
    pkgJsonPaths.map(async (pkgJsonPath) => {
      const pkgPath = pkgJsonPath.replace("package.json", "");
      const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      console.log(`⚙️ Publishing ${pkgPath}@${pkg.version}...`);
      await execa(`npm publish ${pkgPath} --tag canary --access public`);
      console.log(`✅ Published ${pkgPath}`);
    }),
  );
}

async function comment() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  if (!context.payload.pull_request) throw new Error("No pull request");

  const github = getOctokit(token);

  // Get package version
  let text =
    "A new canary is available for testing. You can install this latest build in your project with:\n\n```sh\n";
  for (const pkgJsonPath of pkgJsonPaths) {
    const packageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const version = packageJson.version;
    text += `pnpm add ${packageJson.name}@${version}\n`;
  }
  text += "```\n\n";

  // Create a comment on the PR with the new canary version
  console.log(
    `⚙️ Creating comment on PR #${context.payload.pull_request.number}...`,
  );
  await github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    body: text,
  });

  // Remove the label
  console.log(
    `⚙️ Removing label "release canary" from PR #${context.payload.pull_request.number}...`,
  );
  await github.rest.issues.removeLabel({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    name: "release canary",
  });
}

(async () => {
  await version();
  await publish();
  await comment();

  console.log("✅ Done");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
