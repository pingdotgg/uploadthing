import { join } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {},
  resolve: {
    alias: {
      "uploadthing/server": join(__dirname, "../uploadthing/src/server"),
      "uploadthing/client": join(__dirname, "../uploadthing/src/client"),
    },
  },
});
