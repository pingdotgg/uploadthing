import { uploadRouter } from "./server/uploadthing";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  typescript: { typeCheck: true },
  modules: ["nuxt-uploadthing"],
  uploadthing: {
    router: uploadRouter,
  },
});
