import { join } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {},
  resolve: {
    alias: {
      "@uploadthing/mime-types/db": join(__dirname, "../mime-types/src/db"),
      "uploadthing/server": join(__dirname, "../uploadthing/src/server"),
      "uploadthing/client": join(__dirname, "../uploadthing/src/client"),
    },
  },
});
