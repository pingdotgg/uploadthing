import { execSync } from "child_process";
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
  // eslint-disable-next-line @typescript-eslint/require-await
  async onSuccess() {
    // emit sourcemap to enable jump to definition
    execSync("pnpm tsc --project tsconfig.sourcemap.json");
  },
}));
