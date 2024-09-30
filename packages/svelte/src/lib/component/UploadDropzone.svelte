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
  import Cancel from "./Cancel.svelte";
  import { createDropzone } from "./create-dropzone";
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

  $: className = ($$props.class as string) ?? "";
  $: ({
    mode = "auto",
    appendOnPaste = false,
    cn = defaultClassListMerger,
  } = uploader.config ?? {});
  let acRef = new AbortController();

  let files: File[] = [];
  let uploadProgress = 0;
  let rootRef: HTMLElement;

  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg(uploader.url),
  });
  const { startUpload, isUploading, routeConfig } = createUploadThing(
    uploader.endpoint,
    {
      signal: acRef.signal,
      headers: uploader.headers,
      onClientUploadComplete: (res) => {
        files = [];
        void uploader.onClientUploadComplete?.(res);
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

  const uploadFiles = (files: File[]) => {
    const input = "input" in uploader ? uploader.input : undefined;
    startUpload(files, input).catch((e) => {
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
    if (mode === "auto") uploadFiles(files);
  };

  $: ({ fileTypes, multiple } = generatePermittedFileTypes($routeConfig));

  $: dropzoneOptions = {
    onDrop: onDropCallback,
    multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled,
  };

  const {
    state: dropzoneState,
    dropzoneRoot,
    dropzoneInput,
  } = createDropzone(dropzoneOptions);

  $: ready = fileTypes.length > 0;

  const onUploadClick = (e: MouseEvent) => {
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

      uploadFiles(files);
    }
  };

  onMount(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!appendOnPaste) return;
      // eslint-disable-next-line no-undef
      if (document.activeElement !== rootRef) return;

      const pastedFiles = getFilesFromClipboardEvent(event);
      if (!pastedFiles) return;

      files = [...files, ...pastedFiles];

      onChange?.(files);

      if (mode === "auto") uploadFiles(files);
    };
    // eslint-disable-next-line no-undef
    document.addEventListener("paste", handlePaste);

    // eslint-disable-next-line no-undef
    return () => document.removeEventListener("paste", handlePaste);
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
      {ready
        ? `Choose ${multiple ? "file(s)" : "a file"} or drag and drop`
        : `Loading...`}
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
      {allowedContentTextLabelGenerator($routeConfig)}
    </slot>
  </div>
  <button
    class={cn(
      "group relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
      state === "disabled" && "cursor-not-allowed bg-blue-400",
      state === "readying" && "cursor-not-allowed bg-blue-400",
      state === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
      state === "ready" && "bg-blue-600",
      "disabled:pointer-events-none",
      styleFieldToClassName(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.button, styleFieldArg)}
    on:click={onUploadClick}
    data-ut-element="button"
    data-state={state}
    type="button"
    disabled={files.length === 0 || state === "disabled"}
  >
    <slot name="button-content" state={styleFieldArg}>
      {#if state === "readying"}
        {`Loading...`}
      {:else if state === "uploading"}
        {#if uploadProgress >= 100}
          <Spinner />
        {:else}
          <span class="z-50">
            <span class="block group-hover:hidden">{uploadProgress}%</span>
            <Cancel {cn} className="hidden size-4 group-hover:block" />
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
