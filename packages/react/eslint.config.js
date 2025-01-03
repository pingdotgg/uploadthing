import baseConfig from "@uploadthing/eslint-config/base";
import reactConfig from "@uploadthing/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@uploadthing/react", "@uploadthing/react/*"],
              message: "Use relative src imports instead",
            },
          ],
        },
      ],
    },
  },
];
