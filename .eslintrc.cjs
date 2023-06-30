/** @type {import("eslint").Linter.Config} */
const config = {
  root: true,
  extends: ["@uploadthing"], // uses the config in `packages/config/eslint`
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    tsconfigRootDir: __dirname,
    project: [
      "./examples/*/tsconfig.json",
      "./docs/tsconfig.json",
      "./packages/*/tsconfig.json",
    ],
  },
  settings: {
    next: {
      rootDir: ["examples/*/"],
    },
  },
  overrides: [
    {
      files: [
        "packages/vue/**",
      ],
      rules: {
        "react/display-name": "off",
        "react-hooks/rules-of-hooks": "off",
      }
    }
  ]
};

module.exports = config;
