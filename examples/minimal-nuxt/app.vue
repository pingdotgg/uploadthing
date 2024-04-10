<template>
  <div>Nuxt x UploadThing</div>
  <UploadButton
    :config="{
      endpoint: 'videoAndImage',
      onClientUploadComplete(res) {
        console.log(`onClientUploadComplete`, res);
        alert('Upload Completed');

        res[0]?.serverData;
      },
      onUploadBegin: () => {
        console.log(`onUploadBegin`);
      },
    }"
  />

  <UploadDropzone
    :config="{
      endpoint: 'e2',
      onClientUploadComplete: (res) => {
        console.log(`onClientUploadComplete`, res);
        alert('Upload Completed');

        res[0]?.serverData;
      },
      onUploadBegin: () => {
        console.log(`onUploadBegin`);
      },
    }"
  />

  <input
    type="file"
    @change="
      async (e) => {
        console.log(`e`, e);
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;

        // Do something with files

        // Then start the upload
        await startUpload([file]);
      }
    "
  />
</template>

<script setup lang="ts">
const alert = (msg: string) => {
  window.alert(msg);
};

const { startUpload } = useUploadThing("videoAndImage", {
  onClientUploadComplete(res) {
    console.log(`onClientUploadComplete`, res);
    alert("Upload Completed");
  },
});
</script>
