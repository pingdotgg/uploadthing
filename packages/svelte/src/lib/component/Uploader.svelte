<script
  lang="ts"
  generics="TRouter extends FileRouter, TEndpoint extends keyof TRouter"
>
  import type { FileRouter } from "uploadthing/server";

  import type { UploadthingComponentProps } from "../types";
  import UploadButton from "./UploadButton.svelte";
  import UploadDropzone from "./UploadDropzone.svelte";

  interface Props {
    uploader: UploadthingComponentProps<TRouter, TEndpoint>;
  }

  let { uploader }: Props = $props();
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
