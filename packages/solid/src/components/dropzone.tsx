import { createSignal } from "solid-js";

import { createDropzone } from "@uploadthing/dropzone/solid";
import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  defaultClassListMerger,
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
  resolveMaybeUrlArg,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "@uploadthing/shared";
import type {
  ContentField,
  ErrorMessage,
  StyleField,
} from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/types";

import type { UploadthingComponentProps } from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { progressWidths, Spinner } from "./shared";

type DropzoneStyleFieldCallbackArgs = {
  __runtime: "solid";
  ready: () => boolean;
  isUploading: () => boolean;
  uploadProgress: () => number;
  fileTypes: () => string[];
  isDragActive: () => boolean;
};

type DropzoneAppearance = {
  container?: StyleField<DropzoneStyleFieldCallbackArgs>;
  uploadIcon?: StyleField<DropzoneStyleFieldCallbackArgs>;
  label?: StyleField<DropzoneStyleFieldCallbackArgs>;
  allowedContent?: StyleField<DropzoneStyleFieldCallbackArgs>;
  button?: StyleField<DropzoneStyleFieldCallbackArgs>;
};

type DropzoneContent = {
  uploadIcon?: ContentField<DropzoneStyleFieldCallbackArgs>;
  label?: ContentField<DropzoneStyleFieldCallbackArgs>;
  allowedContent?: ContentField<DropzoneStyleFieldCallbackArgs>;
  button?: ContentField<DropzoneStyleFieldCallbackArgs>;
};

export type UploadDropzoneProps<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
> = UploadthingComponentProps<TRouter, TEndpoint> & {
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-classname-prop
   */
  class?: string;
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-appearance-prop
   */
  appearance?: DropzoneAppearance;
  /**
   * @see https://docs.uploadthing.com/theming#content-customisation
   */
  content?: DropzoneContent;
  /**
   * Callback called when files are dropped or pasted.
   *
   * @param acceptedFiles - The files that were accepted.
   */
  onDrop?: (acceptedFiles: File[]) => void;
};

export const UploadDropzone = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadDropzoneProps<TRouter, TEndpoint>,
) => {
  const [uploadProgress, setUploadProgress] = createSignal(0);
  const $props = props as UploadDropzoneProps<TRouter, TEndpoint>;

  const { mode = "manual", cn = defaultClassListMerger } = $props.config ?? {};

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg($props.url),
  });
  const uploadThing = useUploadThing($props.endpoint, {
    headers: $props.headers,
    onClientUploadComplete: (res) => {
      setFiles([]);
      $props.onClientUploadComplete?.(res);
      setUploadProgress(0);
    },
    onUploadProgress: (p) => {
      setUploadProgress(p);
      $props.onUploadProgress?.(p);
    },
    onUploadError: $props.onUploadError,
    onUploadBegin: $props.onUploadBegin,
    onBeforeUploadBegin: $props.onBeforeUploadBegin,
  });

  const [files, setFiles] = createSignal<File[]>([]);
  const onDrop = (acceptedFiles: File[]) => {
    $props.onDrop?.(acceptedFiles);

    setFiles(acceptedFiles);

    // If mode is auto, start upload immediately
    if (mode === "auto") {
      const input = "input" in $props ? $props.input : undefined;
      void uploadThing.startUpload(acceptedFiles, input);
      return;
    }
  };
  const fileInfo = () =>
    generatePermittedFileTypes(uploadThing.permittedFileInfo()?.config);

  const { getRootProps, getInputProps, isDragActive } = createDropzone({
    onDrop,
    multiple: fileInfo().multiple,
    get accept() {
      return fileInfo().fileTypes
        ? generateClientDropzoneAccept(fileInfo()?.fileTypes ?? [])
        : undefined;
    },
  });

  const ready = () => fileInfo().fileTypes.length > 0;

  const styleFieldArg = {
    ready: ready,
    isUploading: uploadThing.isUploading,
    uploadProgress: uploadProgress,
    fileTypes: () => fileInfo().fileTypes,
    isDragActive: () => isDragActive,
  } as DropzoneStyleFieldCallbackArgs;

  const state = () => {
    if (!ready()) return "readying";
    if (ready() && !uploadThing.isUploading()) return "ready";

    return "uploading";
  };

  return (
    <div
      class={cn(
        "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
        isDragActive && "bg-blue-600/10",
        $props.class,
        styleFieldToClassName($props.appearance?.container, styleFieldArg),
      )}
      {...getRootProps()}
      style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
      data-state={state()}
    >
      {contentFieldToContent($props.content?.uploadIcon, styleFieldArg) ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          class={cn(
            "mx-auto block h-12 w-12 align-middle text-gray-400",
            styleFieldToClassName($props.appearance?.uploadIcon, styleFieldArg),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.uploadIcon,
            styleFieldArg,
          )}
          data-ut-element="upload-icon"
          data-state={state()}
        >
          <path
            fill="currentColor"
            fill-rule="evenodd"
            d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
            clip-rule="evenodd"
          ></path>
        </svg>
      )}
      <label
        class={cn(
          "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
          ready() ? "text-blue-600" : "text-gray-500",
          styleFieldToClassName($props.appearance?.label, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.label, styleFieldArg)}
        data-ut-element="label"
        data-state={state()}
      >
        <input class="sr-only" {...getInputProps()} />
        {contentFieldToContent($props.content?.label, styleFieldArg) ??
          (ready() ? `Choose files or drag and drop` : `Loading...`)}
      </label>
      <div
        class={cn(
          "m-0 h-[1.25rem] text-xs leading-5 text-gray-600",
          styleFieldToClassName(
            $props.appearance?.allowedContent,
            styleFieldArg,
          ),
        )}
        style={styleFieldToCssObject(
          $props.appearance?.allowedContent,
          styleFieldArg,
        )}
        data-ut-element="allowed-content"
        data-state={state()}
      >
        {contentFieldToContent($props.content?.allowedContent, styleFieldArg) ??
          allowedContentTextLabelGenerator(
            uploadThing.permittedFileInfo()?.config,
          )}
      </div>
      {files().length > 0 && (
        <button
          class={cn(
            "relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
            state() === "uploading"
              ? `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${
                  progressWidths[uploadProgress()]
                }`
              : "bg-blue-600",
            styleFieldToClassName($props.appearance?.button, styleFieldArg),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.button,
            styleFieldArg,
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!files()) return;

            const input = "input" in $props ? $props.input : undefined;
            void uploadThing.startUpload(files(), input);
          }}
          data-ut-element="button"
          data-state={state()}
          type="button"
          disabled={state() === "uploading"}
        >
          {contentFieldToContent($props.content?.button, styleFieldArg) ??
            (state() === "uploading" ? (
              <Spinner />
            ) : (
              `Upload ${files().length} file${files().length === 1 ? "" : "s"}`
            ))}
        </button>
      )}
    </div>
  );
};
