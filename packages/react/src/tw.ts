import type { Config } from "tailwindcss";
import plugin from 'tailwindcss/plugin';

export const withUt = (twConfig: Config) => {
  // content can be an object. should add logic for that as well
  if (Array.isArray(twConfig.content)) {
    twConfig.content.push("./node_modules/@uploadthing/react/src/**");
  }

  const utPlugin = plugin(function ({ addVariant }) {
    addVariant('ut-button', '&>label')
    addVariant('ut-allowed-content', '&>div')
  })

  if (!twConfig.plugins) {
    twConfig.plugins = [];
  }

  twConfig.plugins.push(utPlugin);

  if (!twConfig.theme) {
    twConfig.theme = {};
  }

  if (!twConfig.theme.data) {
    twConfig.theme.data = {};
  }

  Object.assign(twConfig.theme.data, {
    'ut-readying': 'ut-state=readying',
    'ut-ready': 'ut-state=ready',
    'ut-uploading': 'ut-state=uploading',
  })

  return twConfig;
};
