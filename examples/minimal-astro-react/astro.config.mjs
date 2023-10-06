import nodejs from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "hybrid",
  adapter: nodejs({
    mode: "middleware",
  }),
});
