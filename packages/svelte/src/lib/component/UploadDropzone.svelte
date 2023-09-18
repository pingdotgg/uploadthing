<script lang="ts" context="module">
  // Workaround for eslint-plugin-svelte issue regarding generics:
  // https://github.com/sveltejs/svelte-eslint-parser/issues/306
  import type { FileRouter } from "uploadthing/server";

  type TRouter = FileRouter;
</script>

<script lang="ts" generics="TRouter extends FileRouter">
  import type { FileWithPath } from "file-selector";
  import { twMerge } from "tailwind-merge";

  import {
    allowedContentTextLabelGenerator,
    classNames,
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
    progressWidths,
  } from "uploadthing/client";

  import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
  import type { DropEvent } from "../utils/dropzone";
  import { styleFieldToString } from "../utils/styles";
  import type { StyleField } from "../utils/styles";
  import Dropzone from "./Dropzone.svelte";
  import type { UploadthingComponentProps } from "./shared";
  import Spinner from "./Spinner.svelte";

  type DropzoneStyleFieldCallbackArgs = {
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
    fileTypes: string[];
    isDragActive: boolean;
  };

  type UploadDropzoneAppearance = {
    container?: StyleField<DropzoneStyleFieldCallbackArgs>;
    uploadIcon?: StyleField<DropzoneStyleFieldCallbackArgs>;
    label?: StyleField<DropzoneStyleFieldCallbackArgs>;
    allowedContent?: StyleField<DropzoneStyleFieldCallbackArgs>;
    button?: StyleField<DropzoneStyleFieldCallbackArgs>;
  };

  type UploadDropzoneConfig = { mode?: "auto" | "manual" };

  export let uploader: UploadthingComponentProps<TRouter>;
  export let appearance: UploadDropzoneAppearance = {};
  export let config: UploadDropzoneConfig = {};
  // Allow to set internal state for testing
  export let __internal_state: "readying" | "ready" | "uploading" | undefined =
    undefined;
  // Allow to set upload progress for testing
  export let __internal_upload_progress: number | undefined = undefined;
  // Allow to set ready explicitly and independently of internal state
  export let __internal_ready: boolean | undefined = undefined;
  // Allow to show the button even if no files were added
  export let __internal_show_button: boolean | undefined = undefined;
  // Allow to disable the button
  export let __internal_button_disabled: boolean | undefined = undefined;
  // Allow to disable the dropzone
  export let __internal_dropzone_disabled: boolean | undefined = undefined;

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
      onUploadBegin: uploader.onUploadBegin,
    },
  );

  $: uploadProgress = __internal_upload_progress ?? uploadProgress;
  $: ({ fileTypes } = generatePermittedFileTypes($permittedFileInfo?.config));
  $: ready =
    __internal_ready ?? (__internal_state === "ready" || fileTypes.length > 0);
  $: className = ($$props.class as string) ?? "";

  $: styleFieldArg = {
    fileTypes,
    isDragActive,
    isUploading: $isUploading,
    ready,
    uploadProgress,
  } satisfies DropzoneStyleFieldCallbackArgs;

  $: state = (() => {
    if (__internal_state) return __internal_state;
    if (!ready) return "readying";
    if (ready && !$isUploading) return "ready";

    return "uploading";
  })();

  const onDrop = (event: CustomEvent<DropEvent>) => {
    const { acceptedFiles } = event.detail;
    files = acceptedFiles as FileWithPath[];

    // If mode is auto, start upload immediately
    if (config?.mode === "auto") {
      const input = "input" in uploader ? uploader.input : undefined;
      void startUpload(files, input);
      return;
    }
  };
</script>

<Dropzone
  bind:inputRef
  bind:isDragActive
  {state}
  let:inputProps
  let:onInputChange
  options={{
    disabled: __internal_dropzone_disabled,
    maxFiles: 2,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
  }}
  class={twMerge(
    "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
    isDragActive && "bg-blue-600/10",
    className,
    styleFieldToString(appearance?.container, styleFieldArg),
  )}
  style={styleFieldToString(appearance?.container, styleFieldArg)}
  on:drop={onDrop}
>
  <slot name="upload-icon" state={styleFieldArg}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      class={twMerge(
        "mx-auto block h-12 w-12 align-middle text-gray-400",
        styleFieldToString(appearance?.uploadIcon, styleFieldArg),
      )}
      style={styleFieldToString(appearance?.uploadIcon, styleFieldArg)}
      data-ut-element="upload-icon"
      data-state={state}
    >
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
        clip-rule="evenodd"
      />
    </svg>
  </slot>
  <label
    for="file-upload"
    class={twMerge(
      classNames(
        "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
        ready ? "text-blue-600" : "text-gray-500",
      ),
      styleFieldToString(appearance?.label, styleFieldArg),
    )}
    style={styleFieldToString(appearance?.label, styleFieldArg)}
    data-ut-element="label"
    data-state={state}
  >
    <slot name="label" state={styleFieldArg}>
      {ready ? `Choose files or drag and drop` : `Loading...`}
    </slot>
    <input
      class="sr-only"
      {...inputProps}
      disabled={!ready}
      on:change|preventDefault={onInputChange}
      bind:this={inputRef}
    />
  </label>
  <div
    class={twMerge(
      "m-0 h-[1.25rem] text-xs leading-5 text-gray-600",
      styleFieldToString(appearance?.allowedContent, styleFieldArg),
    )}
    style={styleFieldToString(appearance?.allowedContent, styleFieldArg)}
    data-ut-element="allowed-content"
    data-state={state}
  >
    <slot name="allowed-content" state={styleFieldArg}>
      {allowedContentTextLabelGenerator($permittedFileInfo?.config)}
    </slot>
  </div>
  {#if __internal_show_button ?? files.length > 0}
    <button
      class={twMerge(
        classNames(
          "relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
          state === "uploading"
            ? `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressWidths[uploadProgress]}`
            : "bg-blue-600",
        ),
        styleFieldToString(appearance?.button, styleFieldArg),
      )}
      style={styleFieldToString(appearance?.button, styleFieldArg)}
      data-ut-element="button"
      data-state={state}
      disabled={__internal_button_disabled ?? state === "uploading"}
      on:click|preventDefault|stopPropagation={() => {
        if (!files) return;
        const input = "input" in uploader ? uploader.input : undefined;
        void startUpload(files, input);
      }}
    >
      <slot name="button-content" state={styleFieldArg}>
        {#if state === "uploading"}
          <Spinner />
        {:else}
          Upload {files.length} file{files.length === 1 ? "" : "s"}
        {/if}
      </slot>
    </button>
  {/if}
</Dropzone>
