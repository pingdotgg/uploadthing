# Nuxt UploadThing Module

[![npm version](https://img.shields.io/npm/v/nuxt-uploadthing/latest.svg?style=flat&colorA=020420&colorB=00DC82)](https://npmjs.com/package/nuxt-uploadthing)
[![npm downloads](https://img.shields.io/npm/dm/nuxt-uploadthing.svg?style=flat&colorA=020420&colorB=00DC82)](https://npm.chart.dev/nuxt-uploadthing)
[![License](https://img.shields.io/npm/l/nuxt-uploadthing.svg?style=flat&colorA=020420&colorB=00DC82)](https://npmjs.com/package/nuxt-uploadthing)
[![Nuxt](https://img.shields.io/badge/Nuxt-020420?logo=nuxt)](https://nuxt.com)

Nuxt module for UploadThing with type-safe router integration, generated components, and auto-registered helpers.

---

## Features

- Type-safe UploadThing router integration
- Auto-generated upload components
- Auto-imported UploadThing Vue helpers
- Optional Tailwind styles integration


---

## Installation

```bash
pnpm add nuxt-uploadthing uploadthing
```

---

## Quick Start

1) Add the module in `nuxt.config.ts`

```ts
export default defineNuxtConfig({
  modules: ['nuxt-uploadthing'],

  uploadthing: {
    fileRouterPath: '@@/server/uploadthing',
    fileRouterExport: 'fileRouter',
    componentPrefix: 'UploadThing',
    useTailwindStyles: false,
  },
})
```

2) Create your UploadThing router in `server/uploadthing.ts`

```ts
import { createUploadthing, type FileRouter } from 'uploadthing/h3'

const f = createUploadthing()

export const fileRouter = {
  imageUploader: f({
    image: { maxFileSize: '4MB', maxFileCount: 1 },
  })
    .middleware(async () => {
      return { userId: 'demo-user' }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
      }
    }),
} satisfies FileRouter
```

3) Use generated components anywhere in your app

```vue
<template>
  <UploadThingUploadButton
    :config="{
      endpoint: 'imageUploader',
      onClientUploadComplete: (res) => console.log(res),
      onUploadError: (error) => console.error(error),
    }"
  />
</template>
```



## Tailwind Styles

To use UploadThing Tailwind styles, enable:

```ts
uploadthing: {
  useTailwindStyles: true,
}
```

Requirements:

1. `tailwindcss` must be installed in your project.
2. Import both Tailwind and `nuxt-uploadthing` styles in your main CSS file (for example `assets/css/main.css`):

```css
@import "tailwindcss";
@import '@uploadthing/nuxt'
```

If `tailwindcss` is missing, the module falls back to UploadThing default CSS.

---

## Module Options

```ts
uploadthing: {
  fileRouterPath: '@@/server/uploadthing',
  fileRouterExport: 'fileRouter',
  componentPrefix: 'Uploadthing',
  useTailwindStyles: false,
}
```

- `fileRouterPath`: Path to your UploadThing router file.
- `fileRouterExport`: Export name of the router in that file.
- `componentPrefix`: Prefix for generated components (`<prefix>UploadButton`, `<prefix>UploadDropzone`).
- `useTailwindStyles`: Enable UploadThing Tailwind styles integration.

---

## Auto-Imports

The module auto-imports these helpers:

- `useUploadThing`
- `createUpload`
- `routeRegistry`
- `uploadFiles`
