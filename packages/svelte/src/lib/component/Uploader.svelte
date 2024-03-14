<script lang="ts" context="module">
  // Workaround for eslint-plugin-svelte issue regarding generics:
  // https://github.com/sveltejs/svelte-eslint-parser/issues/306
  import type { FileRouter } from "uploadthing/server";

  type TRouter = FileRouter;
  type TEndpoint = keyof TRouter;
  type TSkipPolling = boolean;
</script>

<script
  lang="ts"
  generics="TRouter extends FileRouter, TEndpoint extends keyof TRouter, TSkipPolling extends boolean = false"
>
  import type { UploadthingComponentProps } from "../types";
  import UploadButton from "./UploadButton.svelte";
  import UploadDropzone from "./UploadDropzone.svelte";

  export let uploader: UploadthingComponentProps<
    TRouter,
    TEndpoint,
    TSkipPolling
  >;
</script>

<div class="flex flex-col items-center justify-center gap-4">
  <span class="text-center text-4xl font-bold">
    {`Upload a file using a button:`}
  </span>
  <UploadButton {uploader} />
</div>
<div class="flex flex-col items-center justify-center gap-4">
  <span class="text-center text-4xl font-bold">
    {`...or using a dropzone:`}
  </span>
  <UploadDropzone {uploader} />
</div>
