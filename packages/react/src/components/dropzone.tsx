"use client";

import { useCallback, useState } from "react";
import { twMerge } from "tailwind-merge";

import { useDropzone } from "@uploadthing/dropzone/react";
import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  generatePermittedFileTypes,
  getFilesFromClipboardEvent,
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

import { usePaste } from "../hooks/use-paste";
import { INTERNAL_uploadthingHookGen } from "../hooks/use-uploadthing";
import type { UploadthingComponentProps } from "../types";
import { progressWidths, Spinner } from "./shared";

type DropzoneStyleFieldCallbackArgs = {
  __runtime: "react";
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
  isDragActive: boolean;
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
  TSkipPolling extends boolean = false,
> = UploadthingComponentProps<TRouter, TEndpoint, TSkipPolling> & {
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-classname-prop
   */
  className?: string;
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-appearance-prop
   */
  appearance?: DropzoneAppearance;
  /**
   * @see https://docs.uploadthing.com/theming#content-customisation
   */
  content?: DropzoneContent;
};

export function UploadDropzone<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadDropzoneProps<TRouter, TEndpoint, TSkipPolling>,
) {
  // Cast back to UploadthingComponentProps<TRouter> to get the correct type
  // since the ErrorMessage messes it up otherwise
  const $props = props as unknown as UploadDropzoneProps<
    TRouter,
    TEndpoint,
    TSkipPolling
  > & {
    // props not exposed on public type
    // Allow to set internal state for testing
    __internal_state?: "readying" | "ready" | "uploading";
    // Allow to set upload progress for testing
    __internal_upload_progress?: number;
    // Allow to set ready explicitly and independently of internal state
    __internal_ready?: boolean;
    // Allow to show the button even if no files were added
    __internal_show_button?: boolean;
    // Allow to disable the button
    __internal_button_disabled?: boolean;
    // Allow to disable the dropzone
    __internal_dropzone_disabled?: boolean;
  };
  const { mode = "manual", appendOnPaste = false } = $props.config ?? {};

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg($props.url),
  });

  const [uploadProgressState, setUploadProgress] = useState(
    $props.__internal_upload_progress ?? 0,
  );
  const uploadProgress =
    $props.__internal_upload_progress ?? uploadProgressState;
  const { files, setFiles, startUpload, isUploading, routeConfig } =
    useUploadThing($props.endpoint, {
      files: $props.files,
      onFilesChange: $props.onFilesChange,
      headers: $props.headers,
      skipPolling: !$props?.onClientUploadComplete ? true : $props?.skipPolling,
      onClientUploadComplete: (res) => {
        $props.onClientUploadComplete?.(res);
        setUploadProgress(0);
      },
      onUploadProgress: (p, e) => {
        setUploadProgress(p);
        $props.onUploadProgress?.(p, e);
      },
      onUploadError: $props.onUploadError,
      onUploadBegin: $props.onUploadBegin,
      onBeforeUploadBegin: $props.onBeforeUploadBegin,
    });

  const { fileTypes, multiple } = generatePermittedFileTypes(routeConfig);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(
        acceptedFiles.map((file) =>
          Object.assign(file, { status: "pending" as const, key: null }),
        ),
      );

      // If mode is auto, start upload immediately
      if (mode === "auto") {
        const input = "input" in $props ? $props.input : undefined;
        void startUpload(acceptedFiles, input);
        return;
      }
    },
    [$props, mode, startUpload, setFiles],
  );

  const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
    onDrop,
    routeConfig,
    disabled: $props.__internal_dropzone_disabled,
  });

  const ready =
    $props.__internal_ready ??
    ($props.__internal_state === "ready" || fileTypes.length > 0);

  const onUploadClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!files) return;

    const input = "input" in $props ? $props.input : undefined;
    void startUpload(files, input);
  };

  usePaste((event) => {
    if (!appendOnPaste) return;
    if (document.activeElement !== rootRef.current) return;

    const pastedFiles = getFilesFromClipboardEvent(event);
    if (!pastedFiles?.length) return;

    let filesToUpload = pastedFiles;
    setFiles((prev) => {
      filesToUpload = [...prev, ...pastedFiles];
      return filesToUpload;
    });

    if (mode === "auto") {
      const input = "input" in $props ? $props.input : undefined;
      void startUpload(filesToUpload, input);
    }
  });

  const getUploadButtonText = (fileTypes: string[]) => {
    if (files.length > 0)
      return `Upload ${files.length} file${files.length === 1 ? "" : "s"}`;
    if (fileTypes.length === 0) return "Loading...";
    return `Choose File${multiple ? `(s)` : ``}`;
  };

  const getUploadButtonContents = (fileTypes: string[]) => {
    if (state !== "uploading") {
      return getUploadButtonText(fileTypes);
    }
    if (uploadProgress === 100) {
      return <Spinner />;
    }
    return <span className="z-50">{uploadProgress}%</span>;
  };

  const styleFieldArg = {
    fileTypes,
    isDragActive,
    isUploading,
    ready,
    uploadProgress,
  } as DropzoneStyleFieldCallbackArgs;

  const state = (() => {
    if ($props.__internal_state) return $props.__internal_state;
    if (!ready) return "readying";
    if (ready && !isUploading) return "ready";

    return "uploading";
  })();

  return (
    <div
      className={twMerge(
        "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
        isDragActive && "bg-blue-600/10",
        $props.className,
        styleFieldToClassName($props.appearance?.container, styleFieldArg),
      )}
      {...getRootProps()}
      style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
      data-state={state}
    >
      {contentFieldToContent($props.content?.uploadIcon, styleFieldArg) ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className={twMerge(
            "mx-auto block h-12 w-12 align-middle text-gray-400",
            styleFieldToClassName($props.appearance?.uploadIcon, styleFieldArg),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.uploadIcon,
            styleFieldArg,
          )}
          data-ut-element="upload-icon"
          data-state={state}
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
            clipRule="evenodd"
          ></path>
        </svg>
      )}
      <label
        className={twMerge(
          "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
          ready ? "text-blue-600" : "text-gray-500",
          styleFieldToClassName($props.appearance?.label, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.label, styleFieldArg)}
        data-ut-element="label"
        data-state={state}
      >
        <input className="sr-only" {...getInputProps()} />
        {contentFieldToContent($props.content?.label, styleFieldArg) ??
          (ready ? `Choose files or drag and drop` : `Loading...`)}
      </label>
      <div
        className={twMerge(
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
        data-state={state}
      >
        {contentFieldToContent($props.content?.allowedContent, styleFieldArg) ??
          allowedContentTextLabelGenerator(routeConfig)}
      </div>

      <button
        className={twMerge(
          "relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state === "readying" && "cursor-not-allowed bg-blue-400",
          state === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
          state === "ready" && "bg-blue-600",
          "disabled:pointer-events-none",
          styleFieldToClassName($props.appearance?.button, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.button, styleFieldArg)}
        onClick={onUploadClick}
        data-ut-element="button"
        data-state={state}
        type="button"
        disabled={
          $props.__internal_button_disabled ??
          (!files.length || state === "uploading")
        }
      >
        {contentFieldToContent($props.content?.button, styleFieldArg) ??
          getUploadButtonContents(fileTypes)}
      </button>
    </div>
  );
}
