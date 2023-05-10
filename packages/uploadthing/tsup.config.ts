import { defineConfig } from "tsup";

export default defineConfig((opts) => ({
  entry: ["./client.ts", "./server.ts", "./next.ts", "./next-legacy.ts"],
  splitting: false,
  sourcemap: true,
  clean: !opts.watch,
  dts: true,
  format: ["esm"],
  ignoreWatch: [
    "**/.turbo",
    "**/dist",
    "**/node_modules",
    "**/.DS_STORE",
    "**/.git",
  ],
}));
