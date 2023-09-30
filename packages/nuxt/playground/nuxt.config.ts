import { uploadRouter } from "./server/uploadthing";

export default defineNuxtConfig({
  modules: ["../src/module"],
  uploadthing: {
    router: uploadRouter,
  },
  devtools: { enabled: true },
});
