import { resolve } from "path";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "UploadthingVue",
      fileName: "index",
    },
    rollupOptions: {
      external: ["vue", "uploadthing", "@uploadthing/shared"],
      output: {
        globals: {
          vue: "Vue",
          uploadthing: "Uploadthing",
          "@uploadthing/shared": "UploadthingShared",
        },
      },
    },
  },
});
