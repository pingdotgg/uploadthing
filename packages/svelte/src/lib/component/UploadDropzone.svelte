<script
  lang="ts"
  generics="TRouter extends FileRouter, TEndpoint extends keyof TRouter"
>
  import { onMount } from "svelte";
  import type { Snippet } from "svelte";

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
  import type { FileRouter } from "uploadthing/server";

  import { INTERNAL_createUploadThingGen } from "../create-uploadthing.svelte";
  import type { UploadthingComponentProps } from "../types";
  import Cancel from "./Cancel.svelte";
  import { createDropzone } from "./create-dropzone.svelte";
  import { getFilesFromClipboardEvent, progressWidths } from "./shared";
  import Spinner from "./Spinner.svelte";

  type DropzoneStyleFieldCallbackArgs = {
    __runtime: "svelte";
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
    fileTypes: string[];
    isDragActive: boolean;
    files: File[];
  };

  type DropzoneAppearance = {
    container?: StyleField<DropzoneStyleFieldCallbackArgs>;
    uploadIcon?: StyleField<DropzoneStyleFieldCallbackArgs>;
    label?: StyleField<DropzoneStyleFieldCallbackArgs>;
    allowedContent?: StyleField<DropzoneStyleFieldCallbackArgs>;
    button?: StyleField<DropzoneStyleFieldCallbackArgs>;
  };

  type DropzoneContent = {
    uploadIcon?: Snippet<[DropzoneStyleFieldCallbackArgs]>;
    label?: Snippet<[DropzoneStyleFieldCallbackArgs]>;
    allowedContent?: Snippet<[DropzoneStyleFieldCallbackArgs]>;
    button?: Snippet<[DropzoneStyleFieldCallbackArgs]>;
  };

  type Props = {
    uploader: UploadthingComponentProps<TRouter, TEndpoint>;
    onChange?: ((files: File[]) => void) | undefined;
    /**
     * Callback called when files are dropped or pasted.
     *
     * @param acceptedFiles - The files that were accepted.
     * @deprecated Use `onChange` instead
     */
    onDrop?: ((acceptedFiles: File[]) => void) | undefined;
    disabled?: boolean;
    class?: string;
    appearance?: DropzoneAppearance;
    content?: DropzoneContent;
  };

  let {
    uploader,
    onChange,
    onDrop,
    disabled,
    class: className,
    appearance,
    content,
  }: Props = $props();

  let {
    mode = "auto",
    appendOnPaste = false,
    cn = defaultClassListMerger,
  } = $derived(uploader.config ?? {});

  let acRef = new AbortController();

  let rootRef: HTMLElement | undefined = $state();
  let inputRef: HTMLInputElement | undefined = $state();
  let uploadProgress = $state(0);
  let files: File[] = $state([]);

  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg(uploader.url),
  });

  // Cannot destructure when using runes state
  const ut = createUploadThing(
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
    ut.startUpload(files, input).catch((e) => {
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

  let { fileTypes, multiple } = $derived(
    generatePermittedFileTypes(ut.routeConfig),
  );

  // Cannot destructure when using runes state
  const dropzone = $derived(createDropzone({
    rootRef,
    inputRef,
    onDrop: onDropCallback,
    multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled,
  }));

  let ready = $derived(fileTypes.length > 0);

  const onUploadClick = (e: MouseEvent) => {
    if (uploadState === "uploading") {
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
    if (!appendOnPaste) return;

    const handlePaste = (event: ClipboardEvent) => {
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

  let styleFieldArg = $derived({
    __runtime: "svelte",
    fileTypes,
    isDragActive: dropzone.state.isDragActive,
    isUploading: ut.isUploading,
    ready,
    uploadProgress,
    files,
  }) satisfies DropzoneStyleFieldCallbackArgs;

  let uploadState = $derived.by(() => {
    if (disabled) return "disabled";
    if (!ready) return "readying";
    if (ready && !ut.isUploading) return "ready";
    return "uploading";
  });
</script>

<div
  class={cn(
    "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
    dropzone.state.isDragActive && "bg-blue-600/10",
    className,
    styleFieldToClassName(appearance?.container, styleFieldArg),
  )}
  style={styleFieldToClassName(appearance?.container, styleFieldArg)}
  data-state={uploadState}
  bind:this={rootRef}
  {...dropzone.rootProps}
>
  {#if content?.uploadIcon}
    {@render content.uploadIcon(styleFieldArg)}
  {:else}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      class={cn(
        "mx-auto block h-12 w-12 align-middle text-gray-400",
        styleFieldToClassName(appearance?.uploadIcon, styleFieldArg),
      )}
      style={styleFieldToClassName(appearance?.uploadIcon, styleFieldArg)}
      data-ut-element="upload-icon"
      data-state={uploadState}
    >
      <path
        fill="currentColor"
        fill-rule="evenodd"
        d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
        clip-rule="evenodd"
      />
    </svg>
  {/if}
  <label
    class={cn(
      "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
      ready ? "text-blue-600" : "text-gray-500",
      styleFieldToClassName(appearance?.label, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.label, styleFieldArg)}
    data-ut-element="label"
    data-state={uploadState}
  >
    <input class="sr-only" bind:this={inputRef} {...dropzone.inputProps} />
    {#if content?.label}
      {@render content.label(styleFieldArg)}
    {:else}
      {ready
        ? `Choose ${multiple ? "file(s)" : "a file"} or drag and drop`
        : `Loading...`}
    {/if}
  </label>
  <div
    class={cn(
      "m-0 h-[1.25rem] text-xs leading-5 text-gray-600",
      styleFieldToClassName(appearance?.allowedContent, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.allowedContent, styleFieldArg)}
    data-ut-element="allowed-content"
    data-state={uploadState}
  >
    {#if content?.allowedContent}
      {@render content.allowedContent(styleFieldArg)}
    {:else}
      {allowedContentTextLabelGenerator(ut.routeConfig)}
    {/if}
  </div>
  <button
    class={cn(
      "group relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
      uploadState === "disabled" && "cursor-not-allowed bg-blue-400",
      uploadState === "readying" && "cursor-not-allowed bg-blue-400",
      uploadState === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
      uploadState === "ready" && "bg-blue-600",
      "disabled:pointer-events-none",
      styleFieldToClassName(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.button, styleFieldArg)}
    onclick={onUploadClick}
    data-ut-element="button"
    data-state={uploadState}
    type="button"
    disabled={files.length === 0 || uploadState === "disabled"}
  >
    {#if content?.button}
      {@render content.button(styleFieldArg)}
    {:else}
      {#if uploadState === "readying"}
        {`Loading...`}
      {:else if uploadState === "uploading"}
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
    {/if}
  </button>
</div>
