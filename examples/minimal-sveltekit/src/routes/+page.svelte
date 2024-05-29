<script lang="ts">
  import { createUploader, createUploadThing } from "$lib/utils/uploadthing";

  import { UploadButton, UploadDropzone } from "@uploadthing/svelte";

  import "@fontsource-variable/inter";
  import "@uploadthing/svelte/styles.css";

  const uploader = createUploader("videoAndImage", {
    onClientUploadComplete: (res) => {
      console.log(`onClientUploadComplete`, res);
      alert("Upload Completed");
    },
    onUploadError: (error: Error) => {
      alert(`ERROR! ${error.message}`);
    },
  });

  const { startUpload } = createUploadThing("videoAndImage", {
    /**
     * @see https://docs.uploadthing.com/api-reference/react#useuploadthing
     */
    onClientUploadComplete: (res) => {
      console.log(`onClientUploadComplete`, res);
      alert("Upload Completed");
    },
  });
</script>

<main>
  <UploadButton {uploader} />
  <UploadDropzone {uploader} />
  <input
    type="file"
    on:change={async (e) => {
      const file = e.currentTarget.files?.[0];
      if (!file) return;

      // Do something with files

      // Then start the upload
      await startUpload([file]);
    }}
  />
</main>

<style>
  :global(body) {
    font-family: "Inter Variable", sans-serif;
  }
</style>
