import sveltePlugin from "eslint-plugin-svelte";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ["**/*.svelte"],
    plugins: {
      svelte: sveltePlugin,
    },
    languageOptions: {
      parser: sveltePlugin.parser,
      parserOptions: {
        parser: {
          ts: true,
        },
        extraFileExtensions: [".svelte"],
      },
    },
    rules: {
      ...sveltePlugin.configs.recommended.rules,
    },
  },
];
