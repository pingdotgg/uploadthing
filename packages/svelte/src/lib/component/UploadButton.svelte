<script
  lang="ts"
  generics="TRouter extends FileRouter , TEndpoint extends keyof TRouter"
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
    generateMimeTypes,
    generatePermittedFileTypes,
  } from "uploadthing/client";
  import type { FileRouter } from "uploadthing/server";

  import { INTERNAL_createUploadThingGen } from "../create-uploadthing.svelte";
  import type { UploadthingComponentProps } from "../types";
  import Cancel from "./Cancel.svelte";
  import { getFilesFromClipboardEvent, progressWidths } from "./shared";
  import Spinner from "./Spinner.svelte";

  type ButtonStyleFieldCallbackArgs = {
    __runtime: "svelte";
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
    fileTypes: string[];
    files: File[];
  };

  type ButtonAppearance = {
    container?: StyleField<ButtonStyleFieldCallbackArgs>;
    button?: StyleField<ButtonStyleFieldCallbackArgs>;
    allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
    clearBtn?: StyleField<ButtonStyleFieldCallbackArgs>;
  };

  type Props = {
    uploader: UploadthingComponentProps<TRouter, TEndpoint>;
    onChange?: ((files: File[]) => void) | undefined;
    disabled?: boolean;
    class?: string;
    appearance?: ButtonAppearance;
    button?: Snippet<[ButtonStyleFieldCallbackArgs]>;
    allowedContent?: Snippet<[ButtonStyleFieldCallbackArgs]>;
    clearBtn?: Snippet<[ButtonStyleFieldCallbackArgs]>;
  };

  let {
    uploader,
    onChange,
    disabled,
    class: className,
    appearance,
    button,
    allowedContent,
    clearBtn,
  }: Props = $props();

  let {
    mode = "auto",
    appendOnPaste = false,
    cn = defaultClassListMerger,
  } = $derived(uploader.config ?? {});

  let acRef = new AbortController();

  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg(uploader.url),
  });

  let fileInputRef: HTMLInputElement;
  let uploadProgress = $state(0);
  let files: File[] = $state([]);

  // Cannot destructure when using runes state
  const ut = createUploadThing(uploader.endpoint, {
    signal: acRef.signal,
    headers: uploader.headers,
    onClientUploadComplete: (res) => {
      fileInputRef.value = "";
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
  });

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

  let { fileTypes, multiple } = $derived(
    generatePermittedFileTypes(ut.routeConfig),
  );

  // Cannot be called just "state" because the compiler confuses it with the $state rune
  let uploadState = $derived.by(() => {
    if (disabled) return "disabled";
    if (!disabled && !ut.isUploading) return "ready";
    return "uploading";
  });

  onMount(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!appendOnPaste) return;
      // eslint-disable-next-line no-undef
      if (document.activeElement !== fileInputRef) return;

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
    ready: uploadState !== "readying",
    isUploading: uploadState === "uploading",
    uploadProgress,
    fileTypes,
    files,
  }) as ButtonStyleFieldCallbackArgs;
</script>

<!--
@component
Example:
```tsx
  <UploadButton {uploader} />
```
-->
<div
  class={cn(
    "flex flex-col items-center justify-center gap-1",
    className,
    styleFieldToClassName(appearance?.container, styleFieldArg),
  )}
  style={styleFieldToClassName(appearance?.container, styleFieldArg)}
  data-state={uploadState}
>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <label
    class={cn(
      "group relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
      uploadState === "disabled" && "cursor-not-allowed bg-blue-400",
      uploadState === "readying" && "cursor-not-allowed bg-blue-400",
      uploadState === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressWidths[uploadProgress]}`,
      uploadState === "ready" && "bg-blue-600",
      styleFieldToClassName(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToClassName(appearance?.button, styleFieldArg)}
    data-state={uploadState}
    data-ut-element="button"
    onclick={(e) => {
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
    }}
  >
    <input
      bind:this={fileInputRef}
      class="sr-only"
      type="file"
      accept={generateMimeTypes(fileTypes).join(", ")}
      {disabled}
      {multiple}
      tabindex={fileTypes.length === 0 ? -1 : 0}
      onchange={(e) => {
        if (!e.currentTarget?.files) return;
        const selectedFiles = Array.from(e.currentTarget.files);

        onChange?.(selectedFiles);

        if (mode === "manual") {
          files = selectedFiles;
          return;
        }

        uploadFiles(selectedFiles);
      }}
    />
    {#if button}
      {@render button(styleFieldArg)}
    {:else if uploadState === "readying"}
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
  </label>
  {#if mode === "manual" && files.length > 0}
    <button
      onclick={() => {
        files = [];
        fileInputRef.value = "";
        onChange?.([]);
      }}
      class={cn(
        "h-[1.25rem] cursor-pointer rounded border-none bg-transparent text-gray-500 transition-colors hover:bg-slate-200 hover:text-gray-600",
        styleFieldToClassName(appearance?.clearBtn, styleFieldArg),
      )}
      style={styleFieldToClassName(appearance?.clearBtn, styleFieldArg)}
      data-state={uploadState}
      data-ut-element="clear-btn"
    >
      {#if clearBtn}
        {@render clearBtn(styleFieldArg)}
      {:else}
        {`Clear`}
      {/if}
    </button>
  {:else}
    <div
      class={cn(
        "h-[1.25rem] text-xs leading-5 text-gray-600",
        styleFieldToClassName(appearance?.allowedContent, styleFieldArg),
      )}
      style={styleFieldToClassName(appearance?.allowedContent, styleFieldArg)}
      data-state={uploadState}
      data-ut-element="allowed-content"
    >
      {#if allowedContent}
        {@render allowedContent(styleFieldArg)}
      {:else}
        {allowedContentTextLabelGenerator(ut.routeConfig)}
      {/if}
    </div>
  {/if}
</div>
