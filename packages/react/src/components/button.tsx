import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  generateMimeTypes,
  generatePermittedFileTypes,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "uploadthing/client";
import type { ContentField, StyleField } from "uploadthing/client";
import type { ErrorMessage, FileRouter } from "uploadthing/server";

import type { UploadthingComponentProps } from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { getFilesFromClipboardEvent, progressWidths, Spinner } from "./shared";

type ButtonStyleFieldCallbackArgs = {
  __runtime: "react";
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
};

export type UploadButtonProps<TRouter extends FileRouter> =
  UploadthingComponentProps<TRouter> & {
    appearance?: {
      container?: StyleField<ButtonStyleFieldCallbackArgs>;
      button?: StyleField<ButtonStyleFieldCallbackArgs>;
      allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
      clearBtn?: StyleField<ButtonStyleFieldCallbackArgs>;
    };
    content?: {
      button?: ContentField<ButtonStyleFieldCallbackArgs>;
      allowedContent?: ContentField<ButtonStyleFieldCallbackArgs>;
      clearBtn?: ContentField<ButtonStyleFieldCallbackArgs>;
    };
    className?: string;
    config?: {
      appendOnPaste?: boolean;
      mode?: "auto" | "manual";
    };
  };

/**
 * @example
 * <UploadButton<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(res) => console.log(res)}
 *   onUploadError={(err) => console.log(err)}
 * />
 */
export function UploadButton<TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadButtonProps<TRouter>,
) {
  // Cast back to UploadthingComponentProps<TRouter> to get the correct type
  // since the ErrorMessage messes it up otherwise
  const $props = props as unknown as UploadButtonProps<TRouter> & {
    // props not exposed on public type
    // Allow to set internal state for testing
    __internal_state?: "readying" | "ready" | "uploading";
    // Allow to set upload progress for testing
    __internal_upload_progress?: number;
    // Allow to set ready explicitly and independently of internal state
    __internal_ready?: boolean;
    // Allow to disable the button
    __internal_button_disabled?: boolean;
  };

  const { mode = "auto", appendOnPaste = false } = $props.config ?? {};

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const [uploadProgressState, setUploadProgress] = useState(
    $props.__internal_upload_progress ?? 0,
  );
  const [files, setFiles] = useState<File[]>([]);
  const [isManualTriggerDisplayed, setIsManualTriggerDisplayed] =
    useState(false);
  const uploadProgress =
    $props.__internal_upload_progress ?? uploadProgressState;

  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    $props.endpoint,
    {
      onClientUploadComplete: (res) => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setIsManualTriggerDisplayed(false);
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
    },
  );

  const { fileTypes, multiple } = generatePermittedFileTypes(
    permittedFileInfo?.config,
  );

  const ready =
    $props.__internal_ready ??
    ($props.__internal_state === "ready" || fileTypes.length > 0);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!appendOnPaste) return;
      if (document.activeElement !== labelRef.current) return;

      const pastedFiles = getFilesFromClipboardEvent(event);
      if (!pastedFiles) return;

      const filesToUpload =
        $props.onBeforeUploadBegin?.(pastedFiles) ?? pastedFiles;

      setFiles((prev) => [...prev, ...filesToUpload]);

      if (mode === "auto") {
        const input = "input" in $props ? $props.input : undefined;
        void startUpload(files, input);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [startUpload, appendOnPaste, $props, files, mode, fileTypes]);

  const getUploadButtonText = (fileTypes: string[]) => {
    if (isManualTriggerDisplayed)
      return `Upload ${files.length} file${files.length === 1 ? "" : "s"}`;
    if (fileTypes.length === 0) return "Loading...";
    return `Choose File${multiple ? `(s)` : ``}`;
  };

  const getInputProps = () => ({
    type: "file",
    ref: fileInputRef,
    multiple,
    accept: generateMimeTypes(fileTypes ?? [])?.join(", "),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      let selectedFiles = Array.from(e.target.files);
      if ($props.onBeforeUploadBegin) {
        selectedFiles = $props.onBeforeUploadBegin(selectedFiles);
      }

      if (mode === "manual") {
        setFiles(selectedFiles);
        setIsManualTriggerDisplayed(true);
        return;
      }

      const input = "input" in $props ? $props.input : undefined;
      void startUpload(selectedFiles, input);
    },
    disabled: $props.__internal_button_disabled ?? !ready,
    ...(!($props.__internal_button_disabled ?? !ready) ? { tabIndex: 0 } : {}),
  });

  const styleFieldArg = {
    ready: ready,
    isUploading: $props.__internal_state === "uploading" || isUploading,
    uploadProgress,
    fileTypes,
  } as ButtonStyleFieldCallbackArgs;

  const state = (() => {
    if ($props.__internal_state) return $props.__internal_state;
    if (!ready) return "readying";
    if (ready && !isUploading) return "ready";

    return "uploading";
  })();

  const renderClearButton = () => (
    <button
      onClick={() => {
        setFiles([]);
        setIsManualTriggerDisplayed(false);

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }}
      className={twMerge(
        "h-[1.25rem] cursor-pointer rounded border-none bg-transparent text-gray-500 transition-colors hover:bg-slate-200 hover:text-gray-600",
        styleFieldToClassName($props.appearance?.clearBtn, styleFieldArg),
      )}
      style={styleFieldToCssObject($props.appearance?.clearBtn, styleFieldArg)}
      data-state={state}
      data-ut-element="clear-btn"
    >
      {contentFieldToContent($props.content?.clearBtn, styleFieldArg) ??
        "Clear"}
    </button>
  );

  const renderAllowedContent = () => (
    <div
      className={twMerge(
        "h-[1.25rem]  text-xs leading-5 text-gray-600",
        styleFieldToClassName($props.appearance?.allowedContent, styleFieldArg),
      )}
      style={styleFieldToCssObject(
        $props.appearance?.allowedContent,
        styleFieldArg,
      )}
      data-state={state}
      data-ut-element="allowed-content"
    >
      {contentFieldToContent($props.content?.allowedContent, styleFieldArg) ??
        allowedContentTextLabelGenerator(permittedFileInfo?.config)}
    </div>
  );

  return (
    <div
      className={twMerge(
        "flex flex-col items-center justify-center gap-1",
        $props.className,
        styleFieldToClassName($props.appearance?.container, styleFieldArg),
      )}
      style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
      data-state={state}
    >
      <label
        className={twMerge(
          "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state === "readying" && "cursor-not-allowed bg-blue-400",
          state === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
          state === "ready" && "bg-blue-600",
          styleFieldToClassName($props.appearance?.button, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.button, styleFieldArg)}
        data-state={state}
        data-ut-element="button"
        tabIndex={0}
        ref={labelRef}
        onClick={(e) => {
          if (isManualTriggerDisplayed) {
            e.preventDefault();
            e.stopPropagation();
            const input = "input" in $props ? $props.input : undefined;
            void startUpload(files, input);
          }
        }}
      >
        <input {...getInputProps()} className="sr-only" />
        {contentFieldToContent($props.content?.button, styleFieldArg) ??
          (state === "uploading" ? (
            <Spinner />
          ) : (
            getUploadButtonText(fileTypes)
          ))}
      </label>
      {mode === "manual" && files.length > 0
        ? renderClearButton()
        : renderAllowedContent()}
    </div>
  );
}
