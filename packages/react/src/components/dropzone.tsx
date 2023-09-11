import { useCallback, useState } from "react";
import type { FileWithPath } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { twMerge } from "tailwind-merge";

import { classNames, generateClientDropzoneAccept } from "uploadthing/client";
import type { ErrorMessage, FileRouter } from "uploadthing/server";

import type { UploadthingComponentProps } from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import type { ContentField, StyleField } from "../utils/styles";
import {
  contentFieldToContent,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "../utils/styles";
import {
  allowedContentTextLabelGenerator,
  generatePermittedFileTypes,
  progressWidths,
  Spinner,
} from "./shared";

type DropzoneStyleFieldCallbackArgs = {
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
  isDragActive: boolean;
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
    className?: string;
    config?: {
      preview?: boolean;
      mode?: "auto" | "manual";
    };
  };

const FilesPreview = ({
  files,
  updateFiles,
}: {
  files: File[];
  updateFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) => {
  return (
    <div className="flex h-14 w-full flex-col items-center justify-start gap-2 divide-y overflow-y-auto p-4">
      {files.map((file, i) => (
        <div
          key={file.name + i}
          className="group flex w-full items-center justify-between gap-2 rounded-full bg-gray-100 p-1 ring-1 ring-gray-200"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            updateFiles((prev) => prev.filter((f) => f !== file));
          }}
        >
          <div className="flex flex-row items-center gap-2 truncate">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 36 36"
              className="ml-2 h-4 w-4 min-w-min text-gray-600"
            >
              <path
                fill="currentColor"
                d="M8.42 32.6A6.3 6.3 0 0 1 4 30.79l-.13-.13A6.2 6.2 0 0 1 2 26.22a6.77 6.77 0 0 1 2-4.82L19.5 6.07a8.67 8.67 0 0 1 12.15-.35A8 8 0 0 1 34 11.44a9 9 0 0 1-2.7 6.36L17.37 31.6A1 1 0 1 1 16 30.18l13.89-13.8A7 7 0 0 0 32 11.44a6 6 0 0 0-1.76-4.3a6.67 6.67 0 0 0-9.34.35L5.45 22.82A4.78 4.78 0 0 0 4 26.22a4.21 4.21 0 0 0 1.24 3l.13.13a4.64 4.64 0 0 0 6.5-.21l13.35-13.2A2.7 2.7 0 0 0 26 14a2.35 2.35 0 0 0-.69-1.68a2.61 2.61 0 0 0-3.66.13l-9.2 9.12a1 1 0 1 1-1.41-1.42L20.28 11a4.62 4.62 0 0 1 6.48-.13A4.33 4.33 0 0 1 28 14a4.68 4.68 0 0 1-1.41 3.34L13.28 30.58a6.91 6.91 0 0 1-4.86 2.02Z"
              />
              <path fill="none" d="M0 0h36v36H0z" />
            </svg>
            {file.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(file)}
                className="h-3 w-4 object-contain"
              />
            ) : null}
            <div className="truncate text-sm font-semibold leading-6 text-gray-600 group-hover:text-red-500">
              {file.name}
            </div>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            className="mr-2 hidden h-4 w-4 min-w-min text-red-500 group-hover:block"
          >
            <path
              fill="currentColor"
              fillRule="evenodd"
              d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L8.94 10l-5.72 5.72a.75.75 0 1 0 1.06 1.06L10 11.06l5.72 5.72a.75.75 0 1 0 1.06-1.06L11.06 10l5.72-5.72a.75.75 0 0 0-1.06-1.06L10 8.94L4.28 3.22Z"
              clipRule="evenodd"
            ></path>
          </svg>
        </div>
      ))}
    </div>
  );
};

export function UploadDropzone<TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadDropzoneProps<TRouter>,
) {
  // Cast back to UploadthingComponentProps<TRouter> to get the correct type
  // since the ErrorMessage messes it up otherwise
  const $props = props as UploadDropzoneProps<TRouter> & {
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

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

  const [files, setFiles] = useState<File[]>([]);

  const [uploadProgressState, setUploadProgress] = useState(
    $props.__internal_upload_progress ?? 0,
  );
  const uploadProgress =
    $props.__internal_upload_progress ?? uploadProgressState;
  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    $props.endpoint,
    {
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
    },
  );

  const { fileTypes } = generatePermittedFileTypes(permittedFileInfo?.config);

  const onDrop = useCallback(
    (acceptedFiles: FileWithPath[]) => {
      setFiles(acceptedFiles);

      // If mode is auto, start upload immediately
      if ($props.config?.mode === "auto") {
        const input = "input" in $props ? $props.input : undefined;
        void startUpload(acceptedFiles, input);
        return;
      }
    },
    [$props, startUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
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

  const styleFieldArg: DropzoneStyleFieldCallbackArgs = {
    fileTypes,
    isDragActive,
    isUploading,
    ready,
    uploadProgress,
  };

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
      {$props.config?.preview !== false && files.length > 0
        ? null
        : contentFieldToContent($props.content?.uploadIcon, styleFieldArg) ?? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              className={twMerge(
                "mx-auto block h-12 w-12 align-middle text-gray-400",
                styleFieldToClassName(
                  $props.appearance?.uploadIcon,
                  styleFieldArg,
                ),
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

      {$props.config?.preview !== false && files.length > 0 ? (
        <FilesPreview files={files} updateFiles={setFiles} />
      ) : (
        <label
          htmlFor="file-upload"
          className={twMerge(
            classNames(
              "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
              ready ? "text-blue-600" : "text-gray-500",
            ),
            styleFieldToClassName($props.appearance?.label, styleFieldArg),
          )}
          style={styleFieldToCssObject($props.appearance?.label, styleFieldArg)}
          data-ut-element="label"
          data-state={state}
        >
          {contentFieldToContent($props.content?.label, styleFieldArg) ??
            (ready ? `Choose files or drag and drop` : `Loading...`)}
          <input className="sr-only" {...getInputProps()} />
        </label>
      )}
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
          allowedContentTextLabelGenerator(permittedFileInfo?.config)}
      </div>

      {($props.__internal_show_button ?? files.length > 0) && (
        <button
          className={twMerge(
            classNames(
              "relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
              state === "uploading"
                ? `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressWidths[uploadProgress]}`
                : "bg-blue-600",
            ),
            styleFieldToClassName($props.appearance?.button, styleFieldArg),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.button,
            styleFieldArg,
          )}
          onClick={onUploadClick}
          data-ut-element="button"
          data-state={state}
          disabled={$props.__internal_button_disabled ?? state === "uploading"}
        >
          {contentFieldToContent($props.content?.button, styleFieldArg) ??
            (state === "uploading" ? (
              <Spinner />
            ) : (
              `Upload ${files.length} file${files.length === 1 ? "" : "s"}`
            ))}
        </button>
      )}
    </div>
  );
}
