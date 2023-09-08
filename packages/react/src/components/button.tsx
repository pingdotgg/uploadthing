import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  generateMimeTypes,
  generatePermittedFileTypes,
  progressWidths,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "uploadthing/client";
import type { ContentField, StyleField } from "uploadthing/client";
import type { ErrorMessage, FileRouter } from "uploadthing/server";

import type { UploadthingComponentProps } from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { Spinner } from "./shared";

type ButtonStyleFieldCallbackArgs = {
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
};

type ReactStyleField<CallbackArg> = StyleField<CallbackArg, "react">;
type ReactContentField<CallbackArg> = ContentField<CallbackArg, "react">;

export type UploadButtonProps<TRouter extends FileRouter> =
  UploadthingComponentProps<TRouter> & {
    appearance?: {
      container?: ReactStyleField<ButtonStyleFieldCallbackArgs>;
      button?: ReactStyleField<ButtonStyleFieldCallbackArgs>;
      allowedContent?: ReactStyleField<ButtonStyleFieldCallbackArgs>;
    };
    content?: {
      button?: ReactContentField<ButtonStyleFieldCallbackArgs>;
      allowedContent?: ReactContentField<ButtonStyleFieldCallbackArgs>;
    };
    className?: string;
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
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgressState, setUploadProgress] = useState(
    $props.__internal_upload_progress ?? 0,
  );
  const uploadProgress =
    $props.__internal_upload_progress ?? uploadProgressState;
  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    $props.endpoint,
    {
      onClientUploadComplete: (res) => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
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

  const { fileTypes, multiple } = generatePermittedFileTypes(
    permittedFileInfo?.config,
  );

  const ready =
    $props.__internal_ready ??
    ($props.__internal_state === "ready" || fileTypes.length > 0);

  const getUploadButtonText = (fileTypes: string[]) => {
    if (fileTypes.length === 0) return "Loading...";
    return `Choose File${multiple ? `(s)` : ``}`;
  };

  const getInputProps = () => ({
    className: "hidden",
    type: "file",
    ref: fileInputRef,
    multiple,
    accept: generateMimeTypes(fileTypes ?? [])?.join(", "),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      const input = "input" in $props ? $props.input : undefined;
      const files = Array.from(e.target.files);
      void startUpload(files, input);
    },
    disabled: $props.__internal_button_disabled ?? !ready,
  });

  const styleFieldArg: ButtonStyleFieldCallbackArgs = {
    ready: ready,
    isUploading: $props.__internal_state === "uploading" || isUploading,
    uploadProgress,
    fileTypes,
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
        "flex flex-col items-center justify-center gap-1",
        $props.className,
        styleFieldToClassName<"react", ButtonStyleFieldCallbackArgs>(
          $props.appearance?.container,
          styleFieldArg,
        ),
      )}
      style={styleFieldToCssObject<"react", ButtonStyleFieldCallbackArgs>(
        $props.appearance?.container,
        styleFieldArg,
      )}
      data-state={state}
    >
      <label
        className={twMerge(
          "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
          state === "readying" && "cursor-not-allowed bg-blue-400",
          state === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressWidths[uploadProgress]}`,
          state === "ready" && "bg-blue-600",
          styleFieldToClassName<"react", ButtonStyleFieldCallbackArgs>(
            $props.appearance?.button,
            styleFieldArg,
          ),
        )}
        style={styleFieldToCssObject<"react", ButtonStyleFieldCallbackArgs>(
          $props.appearance?.button,
          styleFieldArg,
        )}
        data-state={state}
        data-ut-element="button"
      >
        <input {...getInputProps()} />
        {contentFieldToContent<"react", ButtonStyleFieldCallbackArgs>(
          $props.content?.button,
          styleFieldArg,
        ) ??
          (state === "uploading" ? (
            <Spinner />
          ) : (
            getUploadButtonText(fileTypes)
          ))}
      </label>
      <div
        className={twMerge(
          "h-[1.25rem]  text-xs leading-5 text-gray-600",
          styleFieldToClassName<"react", ButtonStyleFieldCallbackArgs>(
            $props.appearance?.allowedContent,
            styleFieldArg,
          ),
        )}
        style={styleFieldToCssObject<"react", ButtonStyleFieldCallbackArgs>(
          $props.appearance?.allowedContent,
          styleFieldArg,
        )}
        data-state={state}
        data-ut-element="allowed-content"
      >
        {contentFieldToContent<"react", ButtonStyleFieldCallbackArgs>(
          $props.content?.allowedContent,
          styleFieldArg,
        ) ?? allowedContentTextLabelGenerator(permittedFileInfo?.config)}
      </div>
    </div>
  );
}
