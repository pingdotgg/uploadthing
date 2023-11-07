import { defineConfig } from "tsup";

import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  bundle: false,
  entry: ["src/**/*.ts", "!src/**/*.test.*"],
  clean: !opts.watch,
  plugins: [
    {
      name: "fix-cjs",
      renderChunk(_, chunk) {
        if (this.format === "cjs") {
          // replace require("./**.js") with require("./**.cjs")
          const code = chunk.code.replace(
            /require\("(.+?)\.js"\)/g,
            'require("$1.cjs")',
          );
          return { code };
        }
      },
    },
  ],
}));
