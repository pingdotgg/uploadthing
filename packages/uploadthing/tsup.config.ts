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
    "./src/h3.ts",
    "./src/cf-worker.ts",
  ],
  clean: !opts.watch,
  external: ["express", "h3", "tailwindcss"],
  plugins: [
    {
      name: "preserve-node-import-protocol",
      renderChunk(_, chunk) {
        const NODE_BUILTINS = ["util"];
        // tsup strips the node: protocol from imports, but we need it to
        // keep other runtimes happy
        const code = chunk.code.replace(
          new RegExp(`from ['"](${NODE_BUILTINS.join("|")})['"]`, "g"),
          "from 'node:$1'",
        );
        return { code };
      },
    },
  ],
}));
