import baseConfig from "@uploadthing/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@uploadthing/vue", "@uploadthing/vue/*"],
              message: "Use relative src imports instead",
            },
          ],
        },
      ],
    },
  },
];
