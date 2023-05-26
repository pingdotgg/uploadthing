import { defineConfig } from "tsup";
import { config } from "@uploadthing/tsup-config";

export default defineConfig((opts) => ({
  ...config,
  entry: ["./client.ts", "./server.ts", "./next.ts", "./next-legacy.ts"],
  clean: !opts.watch,
}));
