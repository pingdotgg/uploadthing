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

const FilesPreview = ({ files }: { files: FileWithPath[] }) => {
  return (
    <div className="flex flex-row gap-2">
      {files.map((file) =>
        file.type.startsWith("image/") ? (
          <div
            key={file.name}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-lg bg-gray-200 p-1"
          >
            <img
              src={URL.createObjectURL(file)}
              className="h-16 w-full flex-shrink-0 rounded-lg object-cover"
              alt={file.name}
            />
            <span className="mt-1 w-full truncate text-xs font-light text-black">
              {file.name}
            </span>
          </div>
        ) : (
          <div
            key={file.name}
            className="flex h-24 w-24 flex-col items-center justify-center rounded-lg border-2 bg-gray-200 p-1"
          >
            <div className="flex h-16 w-full flex-col items-center justify-center border border-red-600 text-gray-600">
              <span className="text-xl font-semibold">
                {file.name.split(".").pop()?.toUpperCase()}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="32"
                viewBox="0 0 384 512"
              >
                <path
                  fill="currentColor"
                  d="M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z"
                />
              </svg>
            </div>
            <span className="mt-1 w-full truncate text-xs font-light text-black">
              {file.name}
            </span>
          </div>
        ),
      )}
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
  const $props = props as unknown as UploadDropzoneProps<TRouter> & {
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
          (ready ? (
            files.length > 0 ? (
              <FilesPreview files={files} />
            ) : (
              `Choose files or drag and drop`
            )
          ) : (
            `Loading...`
          ))}
        <input className="sr-only" {...getInputProps()} />
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
