import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "../application/index": "src/application.ts",
    "../audio/index": "src/audio.ts",
    "../image/index": "src/image.ts",
    "../text/index": "src/text.ts",
    "../video/index": "src/video.ts",
  },
  format: ["esm", "cjs"],
  dts: { sourcemap: true, tsconfig: "tsconfig.build.json" },
});
