<script lang="ts" context="module">
  // Workaround for eslint-plugin-svelte issue regarding generics:
  // https://github.com/sveltejs/svelte-eslint-parser/issues/306
  import type { FileRouter } from "uploadthing/server";

  type TRouter = FileRouter;
  type TEndpoint = keyof TRouter;
</script>

<script
  lang="ts"
  generics="TRouter extends FileRouter, TEndpoint extends keyof TRouter"
>
  import { onMount } from "svelte";

  import { createDropzone } from "./create-dropzone";
  import {
    allowedContentTextLabelGenerator,
    defaultClassListMerger,
    resolveMaybeUrlArg,
    styleFieldToClassName,
    UploadAbortedError,
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

  export let uploader: UploadthingComponentProps<TRouter, TEndpoint>;
  export let appearance: UploadDropzoneAppearance = {};

  /**
   * Callback called when files are dropped or pasted.
   *
   * @param acceptedFiles - The files that were accepted.
   * @deprecated Use `onChange` instead
   */
  export let onDrop: (acceptedFiles: File[]) => void = () => {
    /** no-op */
  };

  export let onChange: ((files: File[]) => void) | undefined = undefined;

  export let disabled = false;

  // Allow to set internal state for testing
  export let __internal_state: "readying" | "ready" | "uploading" | undefined =
    undefined;
  // Allow to set upload progress for testing
  export let __internal_upload_progress: number | undefined = undefined;
  // Allow to set ready explicitly and independently of internal state
  export let __internal_ready: boolean | undefined = undefined;
  // Allow to show the button even if no files were added
  // export let __internal_show_button: boolean | undefined = undefined;
  // Allow to disable the dropzone
  export let __internal_dropzone_disabled: boolean | undefined = undefined;

  let files: File[] = [];
  let uploadProgress = __internal_upload_progress ?? 0;
  let rootRef: HTMLElement;
  let acRef = new AbortController();

  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg(uploader.url),
  });
  const { startUpload, isUploading, permittedFileInfo } = createUploadThing(
    uploader.endpoint,
    {
      signal: acRef.signal,
      onClientUploadComplete: (res) => {
        files = [];
        uploadProgress = 0;
        uploader.onClientUploadComplete?.(res);
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

  $: ({
    mode = "auto",
    appendOnPaste = false,
    cn = defaultClassListMerger,
  } = uploader.config ?? {});
  $: uploadProgress = __internal_upload_progress ?? uploadProgress;
  $: ({ fileTypes, multiple } = generatePermittedFileTypes(
    $permittedFileInfo?.config,
  ));
  $: ready =
    __internal_ready ?? (__internal_state === "ready" || fileTypes.length > 0);
  $: className = ($$props.class as string) ?? "";

  const uploadFiles = async (files: File[]) => {
    const input = "input" in uploader ? uploader.input : undefined;

    await startUpload(files, input).catch((e) => {
      if (e instanceof UploadAbortedError) {
        void uploader.onUploadAborted?.();
      } else {
        throw e;
      }
    });
  };

  const onDropCallback = (acceptedFiles: File[]) => {
    onDrop?.(acceptedFiles);
    onChange?.(acceptedFiles);

    files = acceptedFiles;

    // If mode is auto, start upload immediately
    if (mode === "auto") void uploadFiles(files);
  };

  $: dropzoneOptions = {
    onDrop: onDropCallback,
    multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled: __internal_dropzone_disabled ?? disabled ?? !ready,
  };

  const {
    state: dropzoneState,
    dropzoneRoot,
    dropzoneInput,
  } = createDropzone(dropzoneOptions);

  const handlePaste = (event: ClipboardEvent) => {
    if (!appendOnPaste) return;
    // eslint-disable-next-line no-undef
    if (document.activeElement !== rootRef) return;

    const pastedFiles = getFilesFromClipboardEvent(event);
    if (!pastedFiles) return;

    files = [...files, ...pastedFiles];

    onChange?.(files);

    if (mode === "auto") void uploadFiles(files);
  };

  onMount(() => {
    // eslint-disable-next-line no-undef
    document.addEventListener("paste", handlePaste);
    return () => {
      // eslint-disable-next-line no-undef
      document.removeEventListener("paste", handlePaste);
    };
  });

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
    if (disabled) return "disabled";
    if (!ready) return "readying";
    if (ready && !$isUploading) return "ready";

    return "uploading";
  })();
</script>

<div
  use:dropzoneRoot
  class={cn(
    "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
    state === "disabled" && "cursor-not-allowed",
    $dropzoneState.isDragActive && "bg-blue-600/10",
    className,
    styleFieldToClassName(appearance?.container, styleFieldArg),
  )}
  style={styleFieldToClassName(appearance?.container, styleFieldArg)}
  data-state={state}
  bind:this={rootRef}
>
  <slot name="upload-icon" state={styleFieldArg}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      class={cn(
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
    class={cn(
      "relative mt-4 flex w-64 items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
      ready && state !== "disabled"
        ? "text-blue-600 cursor-pointer"
        : "text-gray-500 hover:text-gray-500 cursor-not-allowed",
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
    class={cn(
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
    class={cn(
      "group relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 cursor-pointer",
      state === "disabled" && "cursor-not-allowed bg-gray-400",
      state === "readying" && "cursor-not-allowed bg-blue-400",
      state === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
      state === "ready" && "bg-blue-600",
      styleFieldToClassName(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.button, styleFieldArg)}
    data-ut-element="button"
    data-state={state}
    disabled={__internal_dropzone_disabled ?? state === "disabled"}
    on:click={async (e) => {
      if (state === "uploading") {
        e.preventDefault();
        e.stopPropagation();

        acRef.abort();
        acRef = new AbortController();
        return;
      }
      if (mode === "manual" && files.length > 0) {
        e.preventDefault();
        e.stopPropagation();

        await uploadFiles(files);
      }
      console.log("Passing click event through");
    }}
  >
    <slot name="button-content" state={styleFieldArg}>
      {#if state === "uploading"}
        {#if uploadProgress === 100}
          <Spinner />
        {:else}
          <span class="z-50">
            <span class="block group-hover:hidden">{uploadProgress}%</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              stroke-linecap="round"
              stroke-linejoin="round"
              class={cn(
                "fill-none stroke-current stroke-2",
                "hidden size-4 group-hover:block",
              )}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m4.9 4.9 14.2 14.2" />
            </svg>
          </span>
        {/if}
      {:else if mode === "manual" && files.length > 0}
        {`Upload ${files.length} file${files.length === 1 ? "" : "s"}`}
      {:else}
        {`Choose File${multiple ? `(s)` : ``}`}
      {/if}
    </slot>
  </button>
</div>
