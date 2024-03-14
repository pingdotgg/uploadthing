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
  import type { FileWithPath } from "file-selector";
  import { onMount } from "svelte";
  import { twMerge } from "tailwind-merge";

  import {
    allowedContentTextLabelGenerator,
    resolveMaybeUrlArg,
  } from "@uploadthing/shared";
  import {
    generateClientDropzoneAccept,
    generatePermittedFileTypes,
  } from "uploadthing/client";

  import type { UploadthingComponentProps } from "../types";
  import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
  import type { DropEvent } from "../utils/dropzone";
  import { styleFieldToString } from "../utils/styles";
  import type { StyleField } from "../utils/styles";
  import Dropzone from "./Dropzone.svelte";
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
  let uploadProgress = 0;
  let isDragActive = false;
  let rootRef: HTMLElement;
  let inputRef: HTMLInputElement | null;

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg(uploader.url),
  });
  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
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

  $: styleFieldArg = {
    __runtime: "svelte",
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
    if (mode === "auto") {
      const input = "input" in uploader ? uploader.input : undefined;
      void startUpload(files, input);
      return;
    }
  };

  const handlePaste = (event: ClipboardEvent) => {
    if (!appendOnPaste) return;
    // eslint-disable-next-line no-undef
    if (document.activeElement !== rootRef) return;

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
</script>

<Dropzone
  bind:rootRef
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
      "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
      ready ? "text-blue-600" : "text-gray-500",
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
  <button
    class={twMerge(
      "relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
      state === "readying" && "cursor-not-allowed bg-blue-400",
      state === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
      state === "ready" && "bg-blue-600",
      "disabled:pointer-events-none",
      styleFieldToString(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToString(appearance?.button, styleFieldArg)}
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
        <span class="z-50">{uploadProgress}%</span>
      {/if}
    </slot>
  </button>
</Dropzone>
