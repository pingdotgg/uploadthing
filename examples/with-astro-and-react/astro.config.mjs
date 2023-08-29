import nodejs from "@astrojs/node";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [react(), tailwind()],
  output: "hybrid",
  adapter: nodejs({
    mode: "middleware",
  }),
});
