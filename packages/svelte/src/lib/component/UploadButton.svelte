<script lang="ts" generics="TRouter extends FileRouter">
  // The bunch of eslint comments are because eslint-plugin-svelte does not support component generics as of yet:
  // https://github.com/sveltejs/svelte-eslint-parser/issues/306

  import { classNames, generateMimeTypes } from "uploadthing/client";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  import type { FileRouter } from "uploadthing/server";

  import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
  import {
    allowedContentTextLabelGenerator,
    generatePermittedFileTypes,
    progressHeights,
  } from "./shared";
  import type { UploadthingComponentProps } from "./shared";
  import Spinner from "./Spinner.svelte";

  export let uploader: UploadthingComponentProps<TRouter>;

  let uploadProgress = 0;
  let fileInputRef: HTMLInputElement;

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    uploader.endpoint,
    {
      onClientUploadComplete: (res) => {
        if (fileInputRef) {
          fileInputRef.value = "";
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        uploader.onClientUploadComplete?.(res);
        uploadProgress = 0;
      },
      onUploadProgress: (p) => {
        uploadProgress = p;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        uploader.onUploadProgress?.(p);
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      onUploadError: uploader.onUploadError,
    },
  );

  const getUploadButtonText = (fileTypes: string[]) => {
    if (!(fileTypes.length > 0)) return "Loading...";
    return `Choose File${multiple ? `(s)` : ``}`;
  };

  $: ({ fileTypes, multiple } = generatePermittedFileTypes(
    $permittedFileInfo?.config,
  ));
  $: ready = fileTypes.length > 0;
</script>

<!--
@component
Example:
```tsx
  <UploadButton {uploader} />
```
-->
<div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-1">
  <label
    class={classNames(
      "ut-relative ut-flex ut-h-10 ut-w-36 ut-cursor-pointer ut-items-center ut-justify-center ut-overflow-hidden ut-rounded-md after:ut-transition-[width] after:ut-duration-500",
      !ready && "ut-cursor-not-allowed ut-bg-blue-400",
      ready &&
        $isUploading &&
        `ut-bg-blue-400 after:ut-absolute after:ut-left-0 after:ut-h-full after:ut-bg-blue-600 ${progressHeights[uploadProgress]}`,
      ready && !$isUploading && "ut-bg-blue-600",
    )}
  >
    <input
      bind:this={fileInputRef}
      class="ut-hidden"
      type="file"
      accept={generateMimeTypes(fileTypes ?? [])?.join(", ")}
      disabled={!ready}
      {multiple}
      on:change={(e) => {
        if (!e.currentTarget?.files) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        const input = "input" in uploader ? uploader.input : undefined;
        const files = Array.from(e.currentTarget.files);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        void startUpload(files, input);
      }}
    />
    <span class="ut-z-10 ut-px-3 ut-py-2 ut-text-white">
      {#if $isUploading}
        <Spinner />
      {:else}
        {getUploadButtonText(fileTypes)}
      {/if}
    </span>
  </label>
  <div class="ut-h-[1.25rem]">
    {#if fileTypes}
      <p class="ut-m-0 ut-text-xs ut-leading-5 ut-text-gray-600">
        {allowedContentTextLabelGenerator($permittedFileInfo?.config)}
      </p>
    {/if}
  </div>
</div>
