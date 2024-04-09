<script setup lang="ts">
import { UploadButton } from "./uploadthing";

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
          endpoint: 'videoAndImage',
          skipPolling: true,
          onClientUploadComplete: (file) => {
            console.log('uploaded', file);
            alert('Upload complete');
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
