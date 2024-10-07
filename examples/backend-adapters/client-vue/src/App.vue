<script setup lang="ts">
import { UploadButton, UploadDropzone } from "./uploadthing";

function alert(message: string) {
  window.alert(message);
}
</script>

<template>
  <main className="flex flex-col items-center gap-4 py-8">
    <h1 className="text-xl font-bold">Hello from H3!</h1>
    <div>
      <UploadButton
        :config="{
          config: {
            mode: 'manual',
            appendOnPaste: true,
          },
          endpoint: 'videoAndImage',
          onClientUploadComplete: (file) => {
            console.log('uploaded', file);
            alert('Upload complete');
          },
          onUploadAborted: () => {
            alert('Upload Aborted');
          },
          onUploadError: (error) => {
            console.error(error, error.cause);
            alert('Upload failed');
          },
        }"
      />
      <UploadDropzone
        :config="{
          config: {
            mode: 'manual',
            appendOnPaste: true,
          },
          endpoint: 'videoAndImage',
          onClientUploadComplete: (file) => {
            console.log('uploaded', file);
            alert('Upload complete');
          },
          onUploadAborted: () => {
            alert('Upload Aborted');
          },
          onUploadError: (error) => {
            console.error(error, error.cause);
            alert('Upload failed');
          },
        }"
      />
    </div>
  </main>
</template>
