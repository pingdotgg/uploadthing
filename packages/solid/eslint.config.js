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
              group: ["@uploadthing/solid", "@uploadthing/solid/*"],
              message: "Use relative src imports instead",
            },
          ],
        },
      ],
    },
  },
];
