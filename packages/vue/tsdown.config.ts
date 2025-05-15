import { exec } from "node:child_process";
import { promisify } from "node:util";
import { defineConfig } from "tsdown";

const execAsync = promisify(exec);

export default defineConfig({
  entry: {
    index: "src/index.ts",
  },
  format: ["esm", "cjs"],
  dts: {
    sourcemap: true,
    tsconfig: "tsconfig.build.json",
  },
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
