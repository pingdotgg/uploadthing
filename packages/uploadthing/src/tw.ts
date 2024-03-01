import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/**
 * Add more here when additional UI packages are added
 */
const PACKAGES = ["react", "solid"];

export function withUt(twConfig: Config) {
  const contentPaths = PACKAGES.flatMap((pkg) => {
    // We assume a majority of monorepos are max 2 levels deep, but we can add more if needed
    return [
      `./node_modules/@uploadthing/${pkg}/dist/**`,
      `../node_modules/@uploadthing/${pkg}/dist/**`,
      `../../node_modules/@uploadthing/${pkg}/dist/**`,
    ];
  });

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
