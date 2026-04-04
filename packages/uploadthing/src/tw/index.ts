import { dirname, sep } from "node:path";
import type { Config } from "tailwindcss";

import { uploadthingPlugin } from "./plugin";

export { uploadthingPlugin };

/**
 * Add more here when additional UI packages are added
 */
const PACKAGES = ["react", "solid", "svelte", "vue"];

/**
 * HOF for Tailwind config that adds the
 * {@link uploadthingPlugin} to the Tailwind config
 * as well as adds content paths to detect the necessary
 * classnames
 */
export function withUt(twConfig: Config): Config {
  const contentPaths = PACKAGES.map((pkg) => {
    try {
      const resolved = require.resolve(`@uploadthing/${pkg}`, {
        paths: [...module.paths, process.cwd()],
      });

      return dirname(resolved) + sep + "**";
    } catch {
      return null;
    }
  }).filter((s) => s != null);

  if (contentPaths.length === 0) {
    // eslint-disable-next-line no-console
    console.warn(`
  [uploadthing]: Unable to resolve path for uploadthing UI packages. As a workaround, you can manually add the paths to your content paths: 
    - Find where your package manager has installed the distribution files, e.g. './node_modules/@uploadthing/react'.
      Note: If you have a monorepo, you may need to look up the tree to find the correct path.
    - Add the path to the 'content' field in your Tailwind configuration: 
      content: [
        // your other content paths
       './node_modules/@uploadthing/react/dist**' // <-- add this line
      ]
    `);
  }

  if (Array.isArray(twConfig.content)) {
    twConfig.content.push(...contentPaths);
  } else {
    twConfig.content ??= { files: [] };
    // content can be an object too with `files` property
    twConfig.content.files.push(...contentPaths);
  }

  twConfig.plugins ??= [];
  twConfig.plugins.push(uploadthingPlugin);

  return twConfig;
}
