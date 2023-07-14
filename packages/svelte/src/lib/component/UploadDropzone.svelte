<script lang="ts" generics="TRouter extends FileRouter">
  import type { FileWithPath } from "file-selector";

  import { classNames, generateClientDropzoneAccept } from "uploadthing/client";
  import type { FileRouter } from "uploadthing/server";

  import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
  import { normalizeAccept } from "../utils/dropzone";
  import Dropzone from "./Dropzone.svelte";
  import {
    allowedContentTextLabelGenerator,
    generatePermittedFileTypes,
    progressHeights,
    type UploadthingComponentProps,
  } from "./shared";
  import Spinner from "./Spinner.svelte";

  export let uploader: UploadthingComponentProps<TRouter>;

  let files: File[] = [];
  let uploadProgress = 0;
  let isDragActive = false;
  let inputRef: HTMLInputElement | null;

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    uploader.endpoint,
    {
      onClientUploadComplete: (res) => {
        files = [];
        uploader.onClientUploadComplete?.(res);
        uploadProgress = 0;
      },
      onUploadProgress: (p) => {
        uploadProgress = p;
        uploader.onUploadProgress?.(p);
      },
      onUploadError: uploader.onUploadError,
    },
  );

  const onDrop = (acceptedFiles: FileWithPath[]) => {
    files = acceptedFiles;
  };

  $: ({ fileTypes } = generatePermittedFileTypes($permittedFileInfo?.config));
  $: ready = fileTypes.length > 0;
</script>

<div
  class={classNames(
    "ut-mt-2 ut-flex ut-justify-center ut-rounded-lg ut-border ut-border-dashed ut-border-gray-900/25 ut-px-6 ut-py-10",
    isDragActive ? "ut-bg-blue-600/10" : "",
  )}
>
  <Dropzone
    bind:inputRef
    class="ut-text-center"
    let:inputProps
    {onDrop}
    accept={fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined}
    on:dragging={(e) => (isDragActive = e.detail)}
  >
    {@const accept = normalizeAccept(inputProps.accept ?? "")}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      class="ut-mx-auto ut-block ut-h-12 ut-w-12 ut-align-middle ut-text-gray-400"
    >
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
        clip-rule="evenodd"
      />
    </svg>
    <div class="ut-mt-4 ut-flex ut-text-sm ut-leading-6 ut-text-gray-600">
      <label
        for="file-upload"
        class={classNames(
          "ut-relative ut-cursor-pointer ut-font-semibold  focus-within:ut-outline-none focus-within:ut-ring-2 focus-within:ut-ring-blue-600 focus-within:ut-ring-offset-2 hover:ut-text-blue-500",
          ready ? "ut-text-blue-600" : "ut-text-gray-500",
        )}
      >
        <span class="ut-flex ut-w-64 ut-items-center ut-justify-center">
          {ready ? `Choose files or drag and drop` : `Loading...`}
        </span>
        <input
          class="ut-sr-only"
          {...inputProps}
          disabled={!ready}
          accept={Array.isArray(accept) ? accept.join("") : accept}
          on:change={inputProps.onChange}
          on:click={inputProps.onClick}
          bind:this={inputRef}
        />
      </label>
    </div>
    <div class="ut-h-[1.25rem]">
      <p class="ut-m-0 ut-text-xs ut-leading-5 ut-text-gray-600">
        {allowedContentTextLabelGenerator($permittedFileInfo?.config)}
      </p>
    </div>
    {#if files.length > 0}
      <div class="ut-mt-4 ut-flex ut-items-center ut-justify-center">
        <button
          class={classNames(
            "ut-relative ut-flex ut-h-10 ut-w-36 ut-items-center ut-justify-center ut-overflow-hidden ut-rounded-md after:ut-transition-[width] after:ut-duration-500",
            $isUploading
              ? `ut-bg-blue-400 after:ut-absolute after:ut-left-0 after:ut-h-full after:ut-bg-blue-600 ${progressHeights[uploadProgress]}`
              : "ut-bg-blue-600",
          )}
          on:click|preventDefault|stopPropagation={() => {
            if (!files) return;
            const input = "input" in uploader ? uploader.input : undefined;
            void startUpload(files, input);
          }}
        >
          <span class="ut-z-10 ut-px-3 ut-py-2 ut-text-white">
            {#if $isUploading}
              <Spinner />
            {:else}
              Upload {files.length} file{files.length === 1 ? "" : "s"}
            {/if}
          </span>
        </button>
      </div>
    {/if}
  </Dropzone>
</div>
