import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export function withUt(twConfig: Config) {
  if (Array.isArray(twConfig.content)) {
    twConfig.content.push("./node_modules/@uploadthing/react/src/**");
  } else {
    // content can be an object too with `files` property
    twConfig.content.files.push("./node_modules/@uploadthing/react/src/**");
  }

  const utPlugin = plugin(({ addVariant }) => {
    // Variants to select specific underlying element
    addVariant("ut-button", '&>*[data-ut-element="button"]');
    addVariant("ut-allowed-content", '&>*[data-ut-element="allowed-content"]');
    addVariant("ut-label", '&>*[data-ut-element="label"]');
    addVariant("ut-upload-icon", '&>*[data-ut-element="upload-icon"]');

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
