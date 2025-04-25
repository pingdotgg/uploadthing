// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["../src/module", "@nuxtjs/tailwindcss"],
  telemetry: false,
  compatibilityDate: "2024-04-03",
});
