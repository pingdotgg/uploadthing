// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: [
    '@uploadthing/vue/style.css'
  ],
  modules: [
    '@nuxtjs/tailwindcss'
  ]
})
