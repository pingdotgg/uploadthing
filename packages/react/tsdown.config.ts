import { exec } from "node:child_process";
import { promisify } from "node:util";
import { defineConfig } from "tsdown";

const execAsync = promisify(exec);

export default defineConfig({
  entry: {
    "dist/index": "src/index.ts",
    "native/index": "src/native.ts",
    "next-ssr-plugin/index": "src/next-ssr-plugin.tsx",
    "tanstack-ssr-plugin/index": "src/tanstack-ssr-plugin.ts",
  },
  format: ["esm", "cjs"],
  dts: {
    sourcemap: true,
    tsconfig: "tsconfig.build.json",
  },
  outDir: ".",
  clean: false,
  outputOptions: {
    chunkFileNames: "dist/[name]-[hash].js",
    assetFileNames: "dist/[name]-[hash].[ext]",
  },
  external: [
    "next/navigation",
    "@tanstack/react-router",
    "@tanstack/react-start",
  ],
  onSuccess: async (opts) => {
    const isDev = opts.clean.length === 0;
    const shouldMinify = !isDev;

    console.log("Transpiling CSS...");
    const start = Date.now();
    await execAsync(
      `pnpm tailwindcss -i ./src/styles.css -o ./dist/index.css ${shouldMinify ? "--minify" : ""}`,
    );
    console.log(`Transpiled CSS in ${Date.now() - start}ms`);
  },
});
