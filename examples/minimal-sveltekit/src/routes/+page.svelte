<script lang="ts">
  import type { OurFileRouter } from "$lib/server/uploadthing";
  import { useUploadThing } from "$lib/utils/uploadthing";

  import { createUploader, Uploader } from "@uploadthing/svelte";

  const uploader = createUploader<OurFileRouter>({
    endpoint: "withoutMdwr",
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
    onClientUploadComplete: () => {
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
