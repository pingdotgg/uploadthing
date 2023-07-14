<script lang="ts">
  import type { OurFileRouter } from "$lib/server/uploadthing";

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
</script>

<main
  class="flex min-h-screen flex-col items-center justify-center gap-16 p-24"
>
  <Uploader {uploader} />
</main>
