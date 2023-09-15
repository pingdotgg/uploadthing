import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: [
    "./src/client.ts",
    "./src/express.ts",
    "./src/server.ts",
    "./src/next.ts",
    "./src/next-legacy.ts",
    "./src/tw.ts",
    "./src/fastify.ts",
  ],
  clean: !opts.watch,
}));
