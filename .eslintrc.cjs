module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `@uploadthing/eslint-config`
  extends: [
    "@uploadthing",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  settings: {
    next: {
      rootDir: ["examples/*/"],
    },
  },
};
