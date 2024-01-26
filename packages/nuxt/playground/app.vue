<template>
  <div>Playground</div>
  <UploadButton
    :config="{
      endpoint: 'videoAndImage',
      onClientUploadComplete(res) {
        console.log(`onClientUploadComplete`, res);
        // alert('Upload Completed');

        res[0]?.serverData;
        // expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ foo: 'bar' }>()
      },
      onUploadBegin: () => {
        console.log(`onUploadBegin`);
      },
    }"
  />

  <UploadDropzone
    :config="{
      endpoint: 'e2',
      onClientUploadComplete(res) {
        console.log(`onClientUploadComplete`, res);
        // alert('Upload Completed');

        res[0]?.serverData;
        // expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ bar: 'baz' }>()
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
// import { expectTypeOf } from "vitest";

const { startUpload } = useUploadThing("videoAndImage", {
  onClientUploadComplete(res) {
    console.log(`onClientUploadComplete`, res);
    // alert("Upload Completed");

    // expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ foo: "bar" }>();
  },
});

useUploadThing("e2", {
  onClientUploadComplete(res) {
    // expectTypeOf(res[0]?.serverData).toEqualTypeOf<{ bar: "baz" }>();
  },
});
</script>
