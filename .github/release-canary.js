// @ts-check

import { exec } from "node:child_process";
import { getOctokit, context } from "@actions/github";
import { promisify } from "node:util";
import fs from "fs";
import prettier from "@prettier/sync";

const execa = promisify(exec);

const pkgJsonPaths = fs
  .readdirSync("packages")
  .filter((dir) => fs.existsSync(`packages/${dir}/package.json`))
  .filter((dir) => {
    if (!fs.existsSync(`packages/${dir}/package.json`)) return false;
    const pkg = JSON.parse(fs.readFileSync(`packages/${dir}/package.json`, "utf-8"));
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
  }, {})

  for (const pkgJsonPath of pkgJsonPaths) {
    const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    pkg.version = versions[pkg.name];

    // Update dependencies
    for (const dep in pkg.dependencies) {
      if (versions[dep]) {
        pkg.dependencies[dep] = versions[dep];
      }
    }

    const fmt = prettier.format(JSON.stringify(pkg), { filepath: pkgJsonPath })
    fs.writeFileSync(pkgJsonPath, fmt)
  }
}

async function publish() {
  for await (const pkgJsonPath of pkgJsonPaths) {
    const pkgPath = pkgJsonPath.replace("package.json", "");
    console.log(`Publishing ${pkgPath}...`);
    await execa(`npm publish ${pkgPath} --tag canary --access public`);
    console.log(`Published ${pkgPath}.`);
  }
}

async function comment() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN is not set");
  if (!context.payload.pull_request) throw new Error("No pull request");

  const github = getOctokit(token);

  // Get package version
  let text = 'A new canary is available for testing. You can install this latest build in your project with:\n\n```sh\n'
  for (const pkgJsonPath of pkgJsonPaths) {
    const packageJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const version = packageJson.version;
    text += `pnpm add ${packageJson.name}@${version}\n`
  }
  text += '```\n\n'

  // Create a comment on the PR with the new canary version
  github.rest.issues.createComment({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    body: text,
  })

  // Remove the label
  github.rest.issues.removeLabel({
    owner: context.repo.owner,
    repo: context.repo.repo,
    issue_number: context.payload.pull_request.number,
    name: 'release canary',
  });
}

(async () => {
  await version();
  await publish();
  await comment();
})()
  .catch(error => {
    console.error(error);
    process.exit(1);
  })

