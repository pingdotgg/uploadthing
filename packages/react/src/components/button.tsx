"use client";

import { useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

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

type ButtonStyleFieldCallbackArgs = {
  __runtime: "react";
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
};

type ButtonAppearance = {
  container?: StyleField<ButtonStyleFieldCallbackArgs>;
  button?: StyleField<ButtonStyleFieldCallbackArgs>;
  allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
  clearBtn?: StyleField<ButtonStyleFieldCallbackArgs>;
};

type ButtonContent = {
  button?: ContentField<ButtonStyleFieldCallbackArgs>;
  allowedContent?: ContentField<ButtonStyleFieldCallbackArgs>;
  clearBtn?: ContentField<ButtonStyleFieldCallbackArgs>;
};

export type UploadButtonProps<
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
  appearance?: ButtonAppearance;
  /**
   * @see https://docs.uploadthing.com/theming#content-customisation
   */
  content?: ButtonContent;
};

/** These are some internal stuff we use to test the component and for forcing a state in docs */
type UploadThingInternalProps = {
  __internal_state?: "readying" | "ready" | "uploading";
  __internal_upload_progress?: number;
  __internal_button_disabled?: boolean;
};

/**
 * @remarks It is not recommended using this directly as it requires manually binding generics. Instead, use `createUploadButton`.
 * @example
 * <UploadButton<OurFileRouter, "someEndpoint">
 *   endpoint="someEndpoint"
 *   onUploadComplete={(res) => console.log(res)}
 *   onUploadError={(err) => console.log(err)}
 * />
 */
export function UploadButton<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadButtonProps<TRouter, TEndpoint, TSkipPolling>,
) {
  // Cast back to UploadthingComponentProps<TRouter> to get the correct type. ErrorMessage is unreachable
  const $props = props as unknown as UploadButtonProps<
    TRouter,
    TEndpoint,
    TSkipPolling
  > &
    UploadThingInternalProps;

  const { mode = "auto", appendOnPaste = false } = $props.config ?? {};

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg($props.url),
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const [uploadProgress, setUploadProgress] = useState(
    $props.__internal_upload_progress ?? 0,
  );

  const {
    files,
    setFiles,
    startUpload,
    isUploading,
    routeConfig,
    getInputProps,
  } = useUploadThing($props.endpoint, {
    headers: $props.headers,
    skipPolling: !$props?.onClientUploadComplete ? true : $props?.skipPolling,
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
    onBeforeUploadBegin: $props.onBeforeUploadBegin,
  });

  const inputProps = useMemo(
    () => getInputProps({ mode }),
    [getInputProps, mode],
  );
  if ($props.__internal_button_disabled) inputProps.disabled = true;

  const state = (() => {
    if ($props.__internal_state) return $props.__internal_state;
    if (inputProps.disabled) return "readying";
    if (!inputProps.disabled && !isUploading) return "ready";
    return "uploading";
  })();

  usePaste((event) => {
    if (!appendOnPaste) return;
    if (document.activeElement !== fileInputRef.current) return;

    const pastedFiles = getFilesFromClipboardEvent(event);
    if (!pastedFiles) return;

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

  const styleFieldArg = {
    ready: state === "ready",
    isUploading: state === "uploading",
    uploadProgress,
    fileTypes: generatePermittedFileTypes(routeConfig).fileTypes,
  } as ButtonStyleFieldCallbackArgs;

  const renderButton = () => {
    const customContent = contentFieldToContent(
      $props.content?.button,
      styleFieldArg,
    );
    if (customContent) return customContent;

    if (state === "readying") {
      return "Loading...";
    }

    if (state !== "uploading") {
      if (mode === "manual" && files.length > 0) {
        return `Upload ${files.length} file${files.length === 1 ? "" : "s"}`;
      }
      return `Choose File${inputProps.multiple ? `(s)` : ``}`;
    }

    if (uploadProgress === 100) {
      return <Spinner />;
    }

    return <span className="z-50">{uploadProgress}%</span>;
  };

  const renderClearButton = () => (
    <button
      onClick={() => {
        setFiles([]);

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
        allowedContentTextLabelGenerator(routeConfig)}
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
        ref={labelRef}
        onClick={(e) => {
          if (mode === "manual" && files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            const input = "input" in $props ? $props.input : undefined;
            void startUpload(files, input);
          }
        }}
      >
        <input {...inputProps} ref={fileInputRef} className="sr-only" />
        {renderButton()}
      </label>
      {mode === "manual" && files.length > 0
        ? renderClearButton()
        : renderAllowedContent()}
    </div>
  );
}
