import { defineConfig } from "vitest/config";
import { join } from "path";

export default defineConfig({
  test: {},
  resolve: {
    alias: {
      "uploadthing/server": join(__dirname, "../uploadthing/server"),
      "uploadthing/client": join(__dirname, "../uploadthing/client"),
    },
  },
});
