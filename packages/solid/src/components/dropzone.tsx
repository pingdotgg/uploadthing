import { createSignal } from "solid-js";
import type { OnDropHandler } from "solidjs-dropzone";
import { createDropzone } from "solidjs-dropzone";
import { twMerge } from "tailwind-merge";

import {
  allowedContentTextLabelGenerator,
  classNames,
  contentFieldToContent,
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "uploadthing/client";
import type { ContentField, StyleField } from "uploadthing/client";
import type { ErrorMessage, FileRouter } from "uploadthing/server";

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

export type UploadDropzoneProps<TRouter extends FileRouter> =
  UploadthingComponentProps<TRouter> & {
    appearance?: {
      container?: StyleField<DropzoneStyleFieldCallbackArgs>;
      uploadIcon?: StyleField<DropzoneStyleFieldCallbackArgs>;
      label?: StyleField<DropzoneStyleFieldCallbackArgs>;
      allowedContent?: StyleField<DropzoneStyleFieldCallbackArgs>;
      button?: StyleField<DropzoneStyleFieldCallbackArgs>;
    };
    content?: {
      uploadIcon?: ContentField<DropzoneStyleFieldCallbackArgs>;
      label?: ContentField<DropzoneStyleFieldCallbackArgs>;
      allowedContent?: ContentField<DropzoneStyleFieldCallbackArgs>;
      button?: ContentField<DropzoneStyleFieldCallbackArgs>;
    };
    class?: string;
    config?: {
      mode?: "manual" | "auto";
    };
  };

export const UploadDropzone = <TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadDropzoneProps<TRouter>,
) => {
  const [uploadProgress, setUploadProgress] = createSignal(0);
  const $props = props as UploadDropzoneProps<TRouter>;
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
  const uploadThing = useUploadThing($props.endpoint, {
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
    url: $props.url,
  });

  const [files, setFiles] = createSignal<File[]>([]);
  const onDrop: OnDropHandler = (acceptedFiles) => {
    setFiles(acceptedFiles);

    // If mode is auto, start upload immediately
    if ($props.config?.mode === "auto") {
      const input = "input" in $props ? $props.input : undefined;
      void uploadThing.startUpload(acceptedFiles, input);
      return;
    }
  };
  const fileInfo = () =>
    generatePermittedFileTypes(uploadThing.permittedFileInfo()?.config);

  const { getRootProps, getInputProps, isDragActive } = createDropzone({
    onDrop,
    get accept() {
      return fileInfo().fileTypes
        ? generateClientDropzoneAccept(fileInfo()?.fileTypes ?? [])
        : undefined;
    },
    useFsAccessApi: true,
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
      class={twMerge(
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
          class={twMerge(
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
        html-for="file-upload"
        class={twMerge(
          classNames(
            "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
            ready() ? "text-blue-600" : "text-gray-500",
          ),
          styleFieldToClassName($props.appearance?.label, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.label, styleFieldArg)}
        data-ut-element="label"
        data-state={state()}
      >
        {contentFieldToContent($props.content?.label, styleFieldArg) ??
          (ready() ? `Choose files or drag and drop` : `Loading...`)}
        <input class="sr-only" {...getInputProps()} />
      </label>
      <div
        class={twMerge(
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
          class={twMerge(
            classNames(
              "relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
              state() === "uploading"
                ? `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${
                    progressWidths[uploadProgress()]
                  }`
                : "bg-blue-600",
            ),
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
