/**
 * this fixes up the types in the dist folder caused by a bug in nuxt's module builder
 */

const filesToPatch = [
  "dist/runtime/components/button.d.ts",
  "dist/runtime/components/dropzone.d.ts",
  "dist/runtime/composables/useUploadThing.d.ts",
];
const importShim = `import type { UploadRouter } from "#uploadthing-router";\n`;

// Insert import-shim at the top of each file
for (const file of filesToPatch) {
  let content = await Bun.file(file).text();
  content = importShim + content;
  content = content.replace(
    "TEndpoint extends string | number | symbol",
    "TEndpoint extends keyof UploadRouter",
  );
  await Bun.write(file, content);
}

console.log("Patched up types in dist folder");

export {};
