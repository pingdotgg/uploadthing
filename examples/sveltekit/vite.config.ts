import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  // Uploadthing internals use process.env which is not defined in vite, this is a workaround
  // https://github.com/vitejs/vite/issues/1973
  define: {
    "process.env": {},
  },
});
