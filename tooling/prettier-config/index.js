/** @type { import("prettier").Config } */
export default {
  arrowParens: "always",
  printWidth: 80,
  singleQuote: false,
  semi: true,
  trailingComma: "all",
  tabWidth: 2,
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  // Last version that doesn't squash type and value imports
  importOrderTypeScriptVersion: "4.4.0",
  importOrderParserPlugins: ["typescript", "jsx", "explicitResourceManagement"],
  importOrder: [
    "^(react/(.*)$)|^(react$)",
    "^(next/(.*)$)|^(next$)",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@uploadthing/(.*)$",
    "^uploadthing/(.*)$",
    "",
    "^~/(.*)$",
    "^[./]",
  ],
  proseWrap: "always", // printWidth line breaks in md/mdx
};
