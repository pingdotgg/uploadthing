import nodejs from "@astrojs/node";
import react from "@astrojs/react";
import { defineConfig, envField } from "astro/config";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "static",
  adapter: nodejs({
    mode: "middleware",
  }),
  env: {
    schema: {
      UPLOADTHING_TOKEN: envField.string({
        access: "secret",
        context: "server",
      }),
    },
  },
});
