module.exports = {
  root: true,
  // This tells ESLint to load the config from the package `@uploadthing/eslint-config`
  extends: ["@uploadthing"],
  settings: {
    next: {
      rootDir: ["examples/*/"],
    },
  },
};
