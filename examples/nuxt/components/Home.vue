<script setup lang="ts">
import type { OurFileRouter } from "server/uploadthing";

import {
  useUploadButton,
  useUploadDropzone,
  useUploader,
} from "@uploadthing/vue";

const UploadButton = useUploadButton<OurFileRouter>();
const UploadDropzone = useUploadDropzone<OurFileRouter>();
const Uploader = useUploader<OurFileRouter>();
</script>

<template>
  <main
    class="flex min-h-screen flex-col items-center justify-center gap-16 p-24"
  >
    <div class="flex flex-col items-center justify-center gap-4">
      <span class="text-center text-4xl font-bold">
        Upload a file using a button:
      </span>

      <ClientOnly fallback-tag="div" fallback="Loading...">
        <UploadButton
          :config="{
            endpoint: 'videoAndImage',
          }"
        />
      </ClientOnly>
    </div>
    <div className="flex flex-col items-center justify-center gap-4">
      <span className="text-center text-4xl font-bold">
        ...or using a dropzone:
      </span>
      <ClientOnly fallback-tag="div" fallback="Loading...">
        <UploadDropzone
          :config="{
            endpoint: 'withMdwr',
          }"
        />
      </ClientOnly>
    </div>
  </main>
</template>
