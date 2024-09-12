// @ts-check

import * as fs from "node:fs/promises";
import { context, getOctokit } from "@actions/github";

import { UTApi } from "uploadthing/server";

const pr = context.payload.pull_request;
if (!pr) {
  throw new Error("This action should be run on a pull request");
}
if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is not set");
}
const github = getOctokit(process.env.GITHUB_TOKEN);

/**
 * @typedef {{
 *   renderedLength: number;
 *   gzipLength: number;
 *   brotliLength: number;
 *   metaUid: string;
 * }} NodePartStats
 *
 * @typedef {{
 *   version: number;
 *   tree: unknown;
 *   nodeParts: Record<string, NodePartStats>;
 * }} Stats
 */

const STICKY_COMMENT_TITLE = "📦 Bundle size comparison";

/**
 * @param {string} filepath
 * @returns {Promise<number>} total gzip length
 */
async function getTotalBundleSize(filepath) {
  const content = await fs.readFile(filepath, "utf-8");
  /** @type {Stats} */
  const json = JSON.parse(content);

  let totalGzipLength = 0;
  for (const node in json.nodeParts) {
    const { gzipLength } = json.nodeParts[node];
    totalGzipLength += gzipLength;
  }

  return totalGzipLength;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0B";
  const abs = Math.abs(bytes);
  const units = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(abs) / Math.log(1000));
  const size = (abs / Math.pow(1000, i)).toFixed(2);
  return `${size}${units[i]}`;
}

/** @param {number} diff */
function formatDiff(diff) {
  if (diff === 0) return "No change";
  const sign = diff > 0 ? "↑" : "↓";
  return `${sign}${formatBytes(diff)}`;
}

(async () => {
  const mainGzip = await getTotalBundleSize(`bundle-main/out.json`);
  const prGzip = await getTotalBundleSize(`bundle-current-pr/out.json`);

  console.log(`mainGzip: ${formatBytes(mainGzip)}`);
  console.log(`prGzip: ${formatBytes(prGzip)}`);
  console.log(`diff: ${formatDiff(prGzip - mainGzip)}`);

  // Upload HTML files for easy inspection (not on forks)
  let treemapMain = "_No treemap on forks_";
  let treemapPr = "_No treemap on forks_";
  if (
    typeof process.env.UPLOADTHING_TOKEN === "string" &&
    process.env.UPLOADTHING_TOKEN.length > 0
  ) {
    const utapi = new UTApi();
    const files = await utapi.uploadFiles([
      new File(
        [await fs.readFile("bundle-main/out.html", "utf-8")],
        `${context.sha}-bundle-main.html`,
      ),
      new File(
        [await fs.readFile("bundle-current-pr/out.html", "utf-8")],
        `${context.sha}-bundle-pr-${pr.number}.html`,
      ),
    ]);

    if (files[0].data && files[1].data) {
      treemapMain = `[See Treemap 📊](${files[0].data.url})`;
      treemapPr = `[See Treemap 📊](${files[1].data.url})`;
    }
  }

  const commentBody = `
  ## ${STICKY_COMMENT_TITLE}
  
  | Bundle              | Size (gzip)                          | Visualization  |
  | ------------------- | ------------------------------------ | -------------- |
  | Main                | ${formatBytes(mainGzip)}             | ${treemapMain} |
  | PR (${context.sha}) | ${formatBytes(prGzip)}               | ${treemapPr}   |
  | **Diff**            | **${formatDiff(prGzip - mainGzip)}** |                |
  `;

  // Write a comment with the diff
  try {
    const comment = await github.rest.issues
      .listComments({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pr.number,
      })
      .then((cmts) =>
        cmts.data.find((cmt) => cmt.body?.includes(STICKY_COMMENT_TITLE)),
      );
    if (comment) {
      await github.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: comment.id,
        body: commentBody,
      });
    } else {
      await github.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: pr.number,
        body: commentBody,
      });
    }
  } catch (error) {
    console.error(error);
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
