import * as path from "node:path";
import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import importPlugin from "eslint-plugin-import-x";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Ignore files not tracked by VCS and any config files
  includeIgnoreFile(path.join(import.meta.dirname, "../../.gitignore")),
  { ignores: ["**/*.config.*"] },
  {
    files: ["**/*.js", "**/*.ts", "**/*.tsx"],
    plugins: {
      import: importPlugin,
      turbo: turboPlugin,
    },
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      ...turboPlugin.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": ["off"],
      "@typescript-eslint/array-type": [
        "off",
        {
          default: "generic",
          readonly: "generic",
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["off"],
      "@typescript-eslint/no-empty-object-type": ["off"],
      "@typescript-eslint/only-throw-error": ["off"],
      "@typescript-eslint/no-duplicate-type-constituents": ["off"],
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/no-misused-promises": [
        2,
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unnecessary-condition": [
        "error",
        {
          allowConstantLoopConditions: true,
        },
      ],
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "no-console": "error",
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "fetch should be passed as parameter to support overriding default behaviors",
        },
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "effect",
              message:
                'Use alias imports instead (import * as X from "effect/X")',
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/test/**"],
    extends: [tseslint.configs.disableTypeChecked],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  {
    linterOptions: { reportUnusedDisableDirectives: true },
    languageOptions: { parserOptions: { projectService: true } },
  },
);
