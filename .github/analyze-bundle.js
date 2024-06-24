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

/** @param {number} diff */
function formatDiff(diff) {
  if (diff === 0) return "0B 📦";
  const sign = diff > 0 ? "↑" : "↓";

  const units = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(diff) / Math.log(1000));
  const size = (diff / Math.pow(1000, i)).toFixed(2);
  return `${sign}${size}${units[i]} 📦`;
}

(async () => {
  const mainGzip = await getTotalBundleSize(`bundle-main/out.json`);
  const prGzip = await getTotalBundleSize(`bundle-current-pr/out.json`);

  console.log(`mainGzip: ${mainGzip}`);
  console.log(`prGzip: ${prGzip}`);
  console.log(`diff: ${formatDiff(prGzip - mainGzip)}`);

  // Upload HTML files for easy inspection (not on forks)
  let files = [];
  if (
    typeof process.env.UPLOADTHING_SECRET === "string" &&
    process.env.UPLOADTHING_SECRET.length > 0
  ) {
    const utapi = new UTApi();
    files = await utapi.uploadFiles([
      new File(
        [await fs.readFile("bundle-main/out.html", "utf-8")],
        `${context.sha}-bundle-main.html`,
      ),
      new File(
        [await fs.readFile("bundle-current-pr/out.html", "utf-8")],
        `${context.sha}-bundle-pr-${pr.number}.html`,
      ),
    ]);

    if (!files[0].data || !files[1].data) {
      throw new Error("Failed to upload files");
    }

    const commentBody = `
    ## ${STICKY_COMMENT_TITLE}
    
    | Bundle              | Size (gzip)                          | Visualization                          |
    | ------------------- | ------------------------------------ | -------------------------------------- |
    | Main                | ${mainGzip}                          | [See Treemap 📊](${files[0].data.url}) |
    | PR (${context.sha}) | ${prGzip}                            | [See Treemap 📊](${files[1].data.url}) |
    | **Diff**            | **${formatDiff(prGzip - mainGzip)}** |                                        |
    `;

    // Write a comment with the diff
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
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
