import { dirname, sep } from "node:path";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/**
 * Add more here when additional UI packages are added
 */
const PACKAGES = ["react", "solid", "svelte", "vue"];

export function withUt(twConfig: Config) {
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
    // content can be an object too with `files` property
    twConfig.content.files.push(...contentPaths);
  }

  const utPlugin = plugin(({ addVariant }) => {
    // Variants to select specific underlying element
    addVariant("ut-button", '&>*[data-ut-element="button"]');
    addVariant("ut-allowed-content", '&>*[data-ut-element="allowed-content"]');
    addVariant("ut-label", '&>*[data-ut-element="label"]');
    addVariant("ut-upload-icon", '&>*[data-ut-element="upload-icon"]');
    addVariant("ut-clear-btn", '&>*[data-ut-element="clear-btn"]');

    // Variants to select specific state
    addVariant("ut-readying", '&[data-state="readying"]');
    addVariant("ut-ready", '&[data-state="ready"]');
    addVariant("ut-uploading", '&[data-state="uploading"]');
  });

  if (!twConfig.plugins) {
    twConfig.plugins = [];
  }

  twConfig.plugins.push(utPlugin);

  return twConfig;
}
