import baseConfig, { noSelfImport } from "@uploadthing/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**", "playground/**"],
  },
  ...baseConfig,
  {
    files: ["src/**/*.ts", "src/**/*.vue", "src/**/*.mts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        projectService: false,
      },
    },
  },
  noSelfImport("@uploadthing/nuxt"),
];
