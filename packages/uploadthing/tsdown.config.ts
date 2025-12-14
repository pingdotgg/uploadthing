import fsp from "node:fs/promises";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    "client/index": "src/client.ts",
    "client-future/index": "src/client-future.ts",
    "server/index": "src/server.ts",
    "next/index": "src/next.ts",
    "next-legacy/index": "src/next-legacy.ts",
    "effect-platform/index": "src/effect-platform.ts",
    "tw/index": "src/tw/index.ts",
    "fastify/index": "src/fastify.ts",
    "express/index": "src/express.ts",
    "h3/index": "src/h3.ts",
    "react-router/index": "src/react-router.ts",
    "remix/index": "src/remix.ts",
    "types/index": "src/types.ts",
  },
  format: ["esm", "cjs"],
  dts: { sourcemap: true, tsconfig: "tsconfig.build.json" },
  outDir: ".",
  clean: false,
  outputOptions: {
    chunkFileNames: "dist/[name]-[hash].js",
    assetFileNames: "dist/[name]-[hash].[ext]",
  },
  external: ["next", "h3", "fastify", "express"],
  onSuccess: async () => {
    await fsp.copyFile("src/tw/v4.css", "tw/v4.css");
  },
});
