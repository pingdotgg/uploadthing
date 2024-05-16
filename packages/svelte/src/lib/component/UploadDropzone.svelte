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
  import { onMount } from "svelte";
  import { twMerge } from "tailwind-merge";

  import { createDropzone } from "@uploadthing/dropzone/svelte";
  import {
    allowedContentTextLabelGenerator,
    resolveMaybeUrlArg,
    styleFieldToClassName,
  } from "@uploadthing/shared";
  import type { StyleField } from "@uploadthing/shared";
  import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
  } from "uploadthing/client";

  import { INTERNAL_createUploadThingGen } from "../create-uploadthing";
  import type { UploadthingComponentProps } from "../types";
  import { getFilesFromClipboardEvent, progressWidths } from "./shared";
  import Spinner from "./Spinner.svelte";

  type DropzoneStyleFieldCallbackArgs = {
    __runtime: "svelte";
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

  export let uploader: UploadthingComponentProps<
    TRouter,
    TEndpoint,
    TSkipPolling
  >;
  export let appearance: UploadDropzoneAppearance = {};
  export let onDrop: (acceptedFiles: File[]) => void = () => {
    /** no-op */
  };
  // Allow to set internal state for testing
  export let __internal_state: "readying" | "ready" | "uploading" | undefined =
    undefined;
  // Allow to set upload progress for testing
  export let __internal_upload_progress: number | undefined = undefined;
  // Allow to set ready explicitly and independently of internal state
  export let __internal_ready: boolean | undefined = undefined;
  // Allow to show the button even if no files were added
  // export let __internal_show_button: boolean | undefined = undefined;
  // Allow to disable the button
  export let __internal_button_disabled: boolean | undefined = undefined;
  // Allow to disable the dropzone
  export let __internal_dropzone_disabled: boolean | undefined = undefined;

  let files: File[] = [];
  let uploadProgress = __internal_upload_progress ?? 0;

  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg(uploader.url),
  });
  const { startUpload, isUploading, permittedFileInfo } = createUploadThing(
    uploader.endpoint,
    {
      skipPolling: !uploader?.onClientUploadComplete
        ? true
        : uploader?.skipPolling,
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
      onBeforeUploadBegin: uploader.onBeforeUploadBegin,
    },
  );

  $: ({ mode = "auto", appendOnPaste = false } = uploader.config ?? {});
  $: uploadProgress = __internal_upload_progress ?? uploadProgress;
  $: ({ fileTypes, multiple } = generatePermittedFileTypes(
    $permittedFileInfo?.config,
  ));
  $: ready =
    __internal_ready ?? (__internal_state === "ready" || fileTypes.length > 0);
  $: className = ($$props.class as string) ?? "";

  const _onDrop = (acceptedFiles: File[]) => {
    onDrop?.(acceptedFiles);

    files = acceptedFiles;

    // If mode is auto, start upload immediately
    if (mode === "auto") {
      const input = "input" in uploader ? uploader.input : undefined;
      void startUpload(files, input);
      return;
    }
  };

  $: dropzoneOptions = {
    onDrop: _onDrop,
    multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled: __internal_dropzone_disabled,
  };

  const {
    state: dropzoneState,
    rootRef,
    dropzoneRoot,
    dropzoneInput,
  } = createDropzone(dropzoneOptions);

  const handlePaste = (event: ClipboardEvent) => {
    if (!appendOnPaste) return;
    // eslint-disable-next-line no-undef
    if (document.activeElement !== $rootRef) return;

    const pastedFiles = getFilesFromClipboardEvent(event);
    if (!pastedFiles) return;

    files = [...files, ...pastedFiles];

    if (mode === "auto") {
      const input = "input" in uploader ? uploader.input : undefined;
      void startUpload(files, input);
    }
  };

  onMount(() => {
    // eslint-disable-next-line no-undef
    window.addEventListener("paste", handlePaste);
    return () => {
      // eslint-disable-next-line no-undef
      window.removeEventListener("paste", handlePaste);
    };
  });

  const getUploadButtonText = (fileTypes: string[]) => {
    if (files.length > 0)
      return `Upload ${files.length} file${files.length === 1 ? "" : "s"}`;
    if (fileTypes.length === 0) return "Loading...";
    return `Choose File${multiple ? `(s)` : ``}`;
  };

  $: styleFieldArg = {
    __runtime: "svelte",
    fileTypes,
    isDragActive: $dropzoneState.isDragActive,
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
</script>

<div
  use:dropzoneRoot
  class={twMerge(
    "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
    $dropzoneState.isDragActive && "bg-blue-600/10",
    className,
    styleFieldToClassName(appearance?.container, styleFieldArg),
  )}
  style={styleFieldToClassName(appearance?.container, styleFieldArg)}
  data-state={state}
>
  <slot name="upload-icon" state={styleFieldArg}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      class={twMerge(
        "mx-auto block h-12 w-12 align-middle text-gray-400",
        styleFieldToClassName(appearance?.uploadIcon, styleFieldArg),
      )}
      style={styleFieldToClassName(appearance?.uploadIcon, styleFieldArg)}
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
    class={twMerge(
      "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
      ready ? "text-blue-600" : "text-gray-500",
      styleFieldToClassName(appearance?.label, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.label, styleFieldArg)}
    data-ut-element="label"
    data-state={state}
  >
    <input use:dropzoneInput={dropzoneOptions} class="sr-only" />
    <slot name="label" state={styleFieldArg}>
      {ready ? `Choose files or drag and drop` : `Loading...`}
    </slot>
  </label>
  <div
    class={twMerge(
      "m-0 h-[1.25rem] text-xs leading-5 text-gray-600",
      styleFieldToClassName(appearance?.allowedContent, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.allowedContent, styleFieldArg)}
    data-ut-element="allowed-content"
    data-state={state}
  >
    <slot name="allowed-content" state={styleFieldArg}>
      {allowedContentTextLabelGenerator($permittedFileInfo?.config)}
    </slot>
  </div>
  <button
    class={twMerge(
      "relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
      state === "readying" && "cursor-not-allowed bg-blue-400",
      state === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
      state === "ready" && "bg-blue-600",
      "disabled:pointer-events-none",
      styleFieldToClassName(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.button, styleFieldArg)}
    data-ut-element="button"
    data-state={state}
    disabled={__internal_button_disabled ??
      (!files.length || state === "uploading")}
    on:click|preventDefault|stopPropagation={() => {
      if (!files) return;
      const input = "input" in uploader ? uploader.input : undefined;
      void startUpload(files, input);
    }}
  >
    <slot name="button-content" state={styleFieldArg}>
      {#if state !== "uploading"}
        {getUploadButtonText(fileTypes)}
      {:else if uploadProgress === 100}
        <Spinner />
      {:else}
        <span class="relative z-50">{uploadProgress}%</span>
      {/if}
    </slot>
  </button>
</div>
