/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["plugin:svelte/recommended"],
  parserOptions: {
    extraFileExtensions: [".svelte"],
  },
  overrides: [
    {
      files: ["*.svelte"],
      parser: "svelte-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
      },
    },
  ],
};

module.exports = config;
