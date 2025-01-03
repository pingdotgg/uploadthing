import baseConfig from "@uploadthing/eslint-config/base";
import svelteConfig from "@uploadthing/eslint-config/svelte";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...svelteConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@uploadthing/svelte", "@uploadthing/svelte/*"],
              message: "Use relative src imports instead",
            },
          ],
        },
      ],
    },
  },
];
