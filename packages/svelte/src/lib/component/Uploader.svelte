<script lang="ts" context="module">
  // Workaround for eslint-plugin-svelte issue regarding generics:
  // https://github.com/sveltejs/svelte-eslint-parser/issues/306
  import type { FileRouter } from "uploadthing/server";

  type TRouter = FileRouter;
</script>

<script lang="ts" generics="TRouter extends FileRouter">
  import type { UploadthingComponentProps } from "./shared";
  import UploadButton from "./UploadButton.svelte";
  import UploadDropzone from "./UploadDropzone.svelte";

  export let uploader: UploadthingComponentProps<TRouter>;
</script>

<div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
  <span class="ut-text-center ut-text-4xl ut-font-bold">
    {`Upload a file using a button:`}
  </span>
  <UploadButton {uploader} />
</div>
<div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
  <span class="ut-text-center ut-text-4xl ut-font-bold">
    {`...or using a dropzone:`}
  </span>
  <UploadDropzone {uploader} />
</div>
