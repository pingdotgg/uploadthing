# Nuxt UploadThing Module

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href] [![Nuxt][nuxt-src]][nuxt-href]

Nuxt module for getting started with UploadThing in your Nuxt app.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)

## Quick Setup

1. Add `@uploadthing/nuxt` and `uploadthing` dependencies to your project

```bash
# Using pnpm
pnpm add -D @uploadthing/nuxt
pnpm add uploadthing

# Using yarn
yarn add --dev @uploadthing/nuxt
yarn add uploadthing

# Using npm
npm install --save-dev @uploadthing/nuxt
npm install uploadthing

# Using bun
bun add -D @uploadthing/nuxt
bun add uploadthing
```

2. Add `@uploadthing/nuxt` to the `modules` section of `nuxt.config.ts`

```js
export default defineNuxtConfig({
  modules: ["@uploadthing/nuxt"],
});
```

That's it! You can now use @uploadthing/nuxt in your Nuxt app ✨

## Usage

> For full documentation, see the
> [UploadThing docs](https://docs.uploadthing.com/getting-started/nuxt)

1. Create an upload router in your app:

```js
// server/uploadthing.ts
import { createUploadthing, UTFiles } from "uploadthing/h3";
import type { FileRouter } from "uploadthing/h3";

const f = createUploadthing();

/**
 * This is your Uploadthing file router. For more information:
 * @see https://docs.uploadthing.com/api-reference/server#file-routes
 */
export const uploadRouter = {
  videoAndImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 4,
      acl: "public-read",
    },
    video: {
      maxFileSize: "16MB",
    },
  })
    .middleware(({ event, files }) => {
      //           ^? H3Event

      // Return some metadata to be stored with the file
      return { foo: "bar" as const };
    })
    .onUploadComplete(({ file, metadata }) => {
      //                       ^? { foo: "bar" }
      console.log("upload completed", file);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
```

2. Mount a component in your app and start uploading files:

```vue
<script setup lang="ts">
const alert = (msg: string) => {
  window.alert(msg);
};
</script>

<template>
  <div>Playground</div>
  <UploadButton
    :config="{
      endpoint: 'videoAndImage',
      onClientUploadComplete: (res) => {
        console.log(`onClientUploadComplete`, res);
        alert('Upload Completed');
      },
      onUploadBegin: () => {
        console.log(`onUploadBegin`);
      },
    }"
  />

  <UploadDropzone
    :config="{
      endpoint: 'videoAndImage',
      onClientUploadComplete: (res) => {
        console.log(`onClientUploadComplete`, res);
        alert('Upload Completed');
      },
      onUploadBegin: () => {
        console.log(`onUploadBegin`);
      },
    }"
  />
</template>
```

Wow, that was easy!

## Development

From workspace root:

```bash
# Install dependencies
pnpm install

# Develop with the playground (playground is at `examples/minimal-nuxt`)
pnpm dev

# Run ESLint
pnpm lint
```

<!-- Badges -->

[npm-version-src]:
  https://img.shields.io/npm/v/@uploadthing/nuxt/latest.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-version-href]: https://npmjs.com/package/@uploadthing/nuxt
[npm-downloads-src]:
  https://img.shields.io/npm/dm/@uploadthing/nuxt.svg?style=flat&colorA=18181B&colorB=28CF8D
[npm-downloads-href]: https://npmjs.com/package/@uploadthing/nuxt
[license-src]:
  https://img.shields.io/npm/l/@uploadthing/nuxt.svg?style=flat&colorA=18181B&colorB=28CF8D
[license-href]: https://npmjs.com/package/@uploadthing/nuxt
[nuxt-src]: https://img.shields.io/badge/Nuxt-18181B?logo=nuxt.js
[nuxt-href]: https://nuxt.com
