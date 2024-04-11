/**
 * this fixes up the types in the dist folder caused by a bug in nuxt's module builder
 */

const filesToPatch = [
  "dist/runtime/components/button.d.ts",
  "dist/runtime/components/dropzone.d.ts",
  "dist/runtime/composables/useUploadThing.d.ts",
];

// - Insert import-shim at the top of each file
// - Replace refernces to `{}[TEndpoint]` with `UploadRouter[TEndpoint]`
// - Replace `TEndpoint extends never` with `TEndpoint extends keyof UploadRouter`
// - Replace `TEndpoint extends string | number | symbol` with `TEndpoint extends keyof UploadRouter`
for (const file of filesToPatch) {
  let content = await Bun.file(file).text();
  content = [
    'import type { UploadRouter } from "#uploadthing-router"',
    content,
  ].join(";\n");
  content = content
    .replace(
      "TEndpoint extends string | number | symbol",
      "TEndpoint extends keyof UploadRouter",
    )
    .replaceAll(
      "TEndpoint extends never",
      "TEndpoint extends keyof UploadRouter",
    )
    .replaceAll("{}[TEndpoint]", "UploadRouter[TEndpoint]")
    .replaceAll("<{}, TEndpoint", "<UploadRouter, TEndpoint");
  await Bun.write(file, content);
}

console.log("Patched up types in dist folder");

export {};
