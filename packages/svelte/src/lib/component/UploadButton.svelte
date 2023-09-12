<script lang="ts" context="module">
  // Workaround for eslint-plugin-svelte issue regarding generics:
  // https://github.com/sveltejs/svelte-eslint-parser/issues/306
  import type { FileRouter } from "uploadthing/server";

  type TRouter = FileRouter;
</script>

<script lang="ts" generics="TRouter extends FileRouter">
  import { twMerge } from "tailwind-merge";

  import { generateMimeTypes } from "uploadthing/client";

  import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
  import { styleFieldToString } from "../utils/styles";
  import type { StyleField } from "../utils/styles";
  import {
    allowedContentTextLabelGenerator,
    generatePermittedFileTypes,
    progressWidths,
  } from "./shared";
  import type { UploadthingComponentProps } from "./shared";
  import Spinner from "./Spinner.svelte";

  type ButtonStyleFieldCallbackArgs = {
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
    fileTypes: string[];
  };

  type UploadButtonAppearance = {
    container?: StyleField<ButtonStyleFieldCallbackArgs>;
    button?: StyleField<ButtonStyleFieldCallbackArgs>;
    allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
  };

  export let uploader: UploadthingComponentProps<TRouter>;
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

  let uploadProgress = 0;
  let fileInputRef: HTMLInputElement;

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    uploader.endpoint,
    {
      onClientUploadComplete: (res) => {
        if (fileInputRef) {
          fileInputRef.value = "";
        }
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
  $: ({ fileTypes, multiple } = generatePermittedFileTypes(
    $permittedFileInfo?.config,
  ));
  $: ready =
    __internal_ready ?? (__internal_state === "ready" || fileTypes.length > 0);
  $: className = ($$props.class as string) ?? "";

  $: styleFieldArg = {
    ready: ready,
    isUploading: __internal_state === "uploading" || $isUploading,
    uploadProgress,
    fileTypes,
  } satisfies ButtonStyleFieldCallbackArgs;

  $: state = (() => {
    if (__internal_state) return __internal_state;
    if (!ready) return "readying";
    if (ready && !$isUploading) return "ready";

    return "uploading";
  })();

  const getUploadButtonText = (fileTypes: string[]) => {
    if (!(fileTypes.length > 0)) return "Loading...";
    return `Choose File${multiple ? `(s)` : ``}`;
  };
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
    styleFieldToString(appearance?.container, styleFieldArg),
  )}
  style={styleFieldToString(appearance?.container, styleFieldArg)}
  data-state={state}
>
  <label
    class={twMerge(
      "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
      state === "readying" && "cursor-not-allowed bg-blue-400",
      state === "uploading" &&
        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressWidths[uploadProgress]}`,
      state === "ready" && "bg-blue-600",
      styleFieldToString(appearance?.button, styleFieldArg),
    )}
    style={styleFieldToString(appearance?.button, styleFieldArg)}
    data-state={state}
    data-ut-element="button"
  >
    <input
      bind:this={fileInputRef}
      class="hidden"
      type="file"
      accept={generateMimeTypes(fileTypes ?? [])?.join(", ")}
      disabled={__internal_button_disabled ?? !ready}
      {multiple}
      on:change={(e) => {
        if (!e.currentTarget?.files) return;
        const input = "input" in uploader ? uploader.input : undefined;
        const files = Array.from(e.currentTarget.files);
        void startUpload(files, input);
      }}
    />
    <slot name="button-content" state={styleFieldArg}>
      {#if state === "uploading"}
        <Spinner />
      {:else}
        {getUploadButtonText(fileTypes)}
      {/if}
    </slot>
  </label>
  <div
    class={twMerge(
      "h-[1.25rem]  text-xs leading-5 text-gray-600",
      styleFieldToString(appearance?.allowedContent, styleFieldArg),
    )}
    style={styleFieldToString(appearance?.allowedContent, styleFieldArg)}
    data-state={state}
    data-ut-element="allowed-content"
  >
    <slot name="allowed-content" state={styleFieldArg}>
      {allowedContentTextLabelGenerator($permittedFileInfo?.config)}
    </slot>
  </div>
</div>
