import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

export function withUt(twConfig?: Config) {
  const contentPaths = [
    "./node_modules/@uploadthing/react/dist/**",
    "./node_modules/@uploadthing/solid/dist/**",
    "./node_modules/@uploadthing/vue/dist/**",
  ];

  const defaultConfig: {
    content: Config['content'];
    plugins: Required<Config>['plugins'];
  } = {
    content: [],
    plugins: [],
  };

  const config = Object.assign({}, defaultConfig, twConfig);

  if (Array.isArray(config.content)) {
    config.content.push(...contentPaths);
  } else {
    // content can be an object too with `files` property
    config.content.files.push(...contentPaths);
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

  config.plugins.push(utPlugin);

  return twConfig;
}
