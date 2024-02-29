import { readdir } from "fs/promises";

const files = await readdir("src", { recursive: true });

await Bun.build({
  entrypoints: files.filter((file) => file.endsWith(".ts")),
  target: "node",
  external: ["*"],
  outdir: "dist",
});
