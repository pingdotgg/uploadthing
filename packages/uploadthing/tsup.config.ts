import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => [
  {
    ...config,
    entry: [
      "./src/client.ts",
      "./src/server.ts",
      "./src/next.ts",
      "./src/next-legacy.ts",
      "./src/tw.ts",
      "./src/shared/index.ts",
    ],
    clean: !opts.watch,
  },
  {
    ...config,
    entry: ["./src/tw.ts"],
    clean: !opts.watch,
    format: ["cjs", "esm"],
  },
]);
