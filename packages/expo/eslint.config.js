import baseConfig, { noSelfImport } from "@uploadthing/eslint-config/base";
import reactConfig from "@uploadthing/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...reactConfig,
  noSelfImport("@uploadthing/expo"),
];
