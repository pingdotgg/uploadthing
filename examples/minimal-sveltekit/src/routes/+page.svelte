<script lang="ts">
  import { createUploader, useUploadThing } from "$lib/utils/uploadthing";

  import { Uploader } from "@uploadthing/svelte";

  import "@fontsource-variable/inter";

  const uploader = createUploader("videoAndImage", {
    onClientUploadComplete: (res) => {
      console.log(`onClientUploadComplete`, res);
      alert("Upload Completed");
    },
    onUploadError: (error: Error) => {
      alert(`ERROR! ${error.message}`);
    },
  });

  const { startUpload } = useUploadThing("videoAndImage", {
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
  <Uploader {uploader} />
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
