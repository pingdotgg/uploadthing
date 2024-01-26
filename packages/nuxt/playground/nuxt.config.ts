export default defineNuxtConfig({
  modules: ["../src/module"],
  devtools: { enabled: true },
  uploadthing: {
    logLevel: "debug",
  },
});
