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
  generics="TRouter extends FileRouter , TEndpoint extends keyof TRouter, TSkipPolling extends boolean = false"
>
  import { onMount } from "svelte";
  import { twMerge } from "tailwind-merge";

  import {
    allowedContentTextLabelGenerator,
    resolveMaybeUrlArg,
    styleFieldToClassName,
    UploadAbortedError,
  } from "@uploadthing/shared";
  import type { StyleField } from "@uploadthing/shared";
  import {
    generateMimeTypes,
    generatePermittedFileTypes,
  } from "uploadthing/client";

  import { INTERNAL_createUploadThingGen } from "../create-uploadthing";
  import type { UploadthingComponentProps } from "../types";
  import { getFilesFromClipboardEvent, progressWidths } from "./shared";
  import Spinner from "./Spinner.svelte";

  type ButtonStyleFieldCallbackArgs = {
    __runtime: "svelte";
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
    fileTypes: string[];
  };

  type UploadButtonAppearance = {
    container?: StyleField<ButtonStyleFieldCallbackArgs>;
    button?: StyleField<ButtonStyleFieldCallbackArgs>;
    allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
    clearBtn?: StyleField<ButtonStyleFieldCallbackArgs>;
  };

  export let uploader: UploadthingComponentProps<
    TRouter,
    TEndpoint,
    TSkipPolling
  >;
  export let appearance: UploadButtonAppearance = {};
  // Allow to set internal state for testing
  export let __internal_state: "readying" | "ready" | "uploading" | undefined =
    undefined;
  // Allow to set upload progress for testing
  export let __internal_upload_progress: number | undefined = undefined;
  // Allow to set ready explicitly and independently of internal state
  export let __internal_ready: boolean | undefined = undefined;
  // Allow to disable the button
  export let __internal_button_disabled: boolean | undefined = undefined;

  export let onChange: ((files: File[]) => void) | undefined = undefined;

  let uploadProgress = 0;
  let fileInputRef: HTMLInputElement;
  let files: File[] = [];
  let acRef = new AbortController();

  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg(uploader.url),
  });
  const { startUpload, isUploading, permittedFileInfo } = createUploadThing(
    uploader.endpoint,
    {
      signal: acRef.signal,
      skipPolling: !uploader?.onClientUploadComplete
        ? true
        : uploader?.skipPolling,
      onClientUploadComplete: (res) => {
        fileInputRef.value = "";
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
    ready: ready,
    isUploading: __internal_state === "uploading" || $isUploading,
    uploadProgress,
    fileTypes,
  } satisfies ButtonStyleFieldCallbackArgs;

  $: state = (() => {
    if (__internal_state) return __internal_state;
    if (uploader.disabled) return "disabled";
    if (!ready) return "readying";
    if (ready && !$isUploading) return "ready";

    return "uploading";
  })();

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

  const handlePaste = (event: ClipboardEvent) => {
    if (!appendOnPaste) return;
    // eslint-disable-next-line no-undef
    if (document.activeElement !== fileInputRef) return;

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
</script>

<!--
@component
Example:
```tsx
  <UploadButton {uploader} />
```
-->
<div
  class={twMerge(
    "flex flex-col items-center justify-center gap-1",
    className,
    styleFieldToClassName(appearance?.container, styleFieldArg),
  )}
  style={styleFieldToClassName(appearance?.container, styleFieldArg)}
  data-state={state}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <label
    class={twMerge(
      "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
      state === "disabled" && "cursor-not-allowed bg-blue-400",
      state === "readying" && "cursor-not-allowed bg-blue-400",
      state === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressWidths[uploadProgress]}`,
      state === "ready" && "bg-blue-600",
      styleFieldToClassName(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.button, styleFieldArg)}
    data-state={state}
    data-ut-element="button"
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
    }}
  >
    <input
      bind:this={fileInputRef}
      class="sr-only"
      type="file"
      accept={generateMimeTypes(fileTypes).join(", ")}
      disabled={(uploader.disabled || !ready) ?? __internal_button_disabled}
      {multiple}
      on:change={async (e) => {
        if (!e.currentTarget?.files) return;
        const selectedFiles = Array.from(e.currentTarget.files);

        onChange?.(selectedFiles);

        if (mode === "manual") {
          files = selectedFiles;
          return;
        }

        await uploadFiles(selectedFiles);
      }}
    />
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
              class={twMerge(
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
  </label>
  {#if mode === "manual" && files.length > 0}
    <button
      on:click={() => {
        files = [];
        fileInputRef.value = "";
      }}
      class={twMerge(
        "h-[1.25rem] cursor-pointer rounded border-none bg-transparent text-gray-500 transition-colors hover:bg-slate-200 hover:text-gray-600",
        styleFieldToClassName(appearance?.clearBtn, styleFieldArg),
      )}
      style={styleFieldToClassName(appearance?.clearBtn, styleFieldArg)}
      data-state={state}
      data-ut-element="clear-btn"
    >
      <slot name="clear-btn" state={styleFieldArg}>Clear</slot>
    </button>
  {:else}
    <div
      class={twMerge(
        "h-[1.25rem]  text-xs leading-5 text-gray-600",
        styleFieldToClassName(appearance?.allowedContent, styleFieldArg),
      )}
      style={styleFieldToClassName(appearance?.allowedContent, styleFieldArg)}
      data-state={state}
      data-ut-element="allowed-content"
    >
      <slot name="allowed-content" state={styleFieldArg}>
        {allowedContentTextLabelGenerator($permittedFileInfo?.config)}
      </slot>
    </div>
  {/if}
</div>
