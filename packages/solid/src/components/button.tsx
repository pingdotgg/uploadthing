import { createSignal } from "solid-js";
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
  ready: () => boolean;
  isUploading: () => boolean;
  uploadProgress: () => number;
  fileTypes: () => string[];
};

export type UploadButtonProps<TRouter extends FileRouter> =
  UploadthingComponentProps<TRouter> & {
    appearance?: {
      container?: StyleField<ButtonStyleFieldCallbackArgs>;
      button?: StyleField<ButtonStyleFieldCallbackArgs>;
      allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
    };
    content?: {
      button?: ContentField<ButtonStyleFieldCallbackArgs>;
      allowedContent?: ContentField<ButtonStyleFieldCallbackArgs>;
    };
    class?: string;
  };

/**
 * @example
 * <UploadButton<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(url) => console.log(url)}
 * />
 */
export function UploadButton<TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadButtonProps<TRouter>,
) {
  const [uploadProgress, setUploadProgress] = createSignal(0);
  let inputRef: HTMLInputElement;
  const $props = props as UploadButtonProps<TRouter>;
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
  const uploadedThing = useUploadThing($props.endpoint, {
    onClientUploadComplete: (res) => {
      if (inputRef) {
        inputRef.value = "";
      }
      $props.onClientUploadComplete?.(res);
      setUploadProgress(0);
    },
    onUploadProgress: (p) => {
      setUploadProgress(p);
      $props.onUploadProgress?.(p);
    },
    onUploadError: $props.onUploadError,
    url: $props.url,
  });

  const fileInfo = () =>
    generatePermittedFileTypes(uploadedThing.permittedFileInfo()?.config);

  const ready = () => fileInfo().fileTypes.length > 0;

  const styleFieldArg: ButtonStyleFieldCallbackArgs = {
    ready: ready,
    isUploading: uploadedThing.isUploading,
    uploadProgress: uploadProgress,
    fileTypes: () => fileInfo().fileTypes,
  };

  const state = () => {
    if (!ready()) return "readying";
    if (ready() && !uploadedThing.isUploading()) return "ready";

    return "uploading";
  };

  const getUploadButtonText = (fileTypes: string[]) => {
    if (fileTypes.length === 0) return "Loading...";
    return `Choose File${fileInfo().multiple ? `(s)` : ``}`;
  };

  return (
    <div
      class={twMerge(
        "flex flex-col items-center justify-center gap-1",
        $props.class,
        styleFieldToClassName($props.appearance?.container, styleFieldArg),
      )}
      style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
      data-state={state()}
    >
      <label
        class={twMerge(
          "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
          state() === "readying" && "cursor-not-allowed bg-blue-400",
          state() === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${
              progressWidths[uploadProgress()]
            }`,
          state() === "ready" && "bg-blue-600",
          styleFieldToClassName($props.appearance?.button, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.button, styleFieldArg)}
        data-state={state()}
        data-ut-element="button"
      >
        <input
          class="hidden"
          ref={inputRef!}
          type="file"
          multiple={fileInfo().multiple}
          accept={generateMimeTypes(fileInfo().fileTypes ?? [])?.join(", ")}
          onChange={(e) => {
            if (!e.target.files) return;
            const input = "input" in $props ? $props.input : undefined;
            const files = Array.from(e.target.files);
            void uploadedThing.startUpload(files, input);
          }}
        />
        {contentFieldToContent($props.content?.button, styleFieldArg) ??
          (state() === "uploading" ? (
            <Spinner />
          ) : (
            getUploadButtonText(fileInfo().fileTypes)
          ))}
      </label>
      <div
        class={twMerge(
          "h-[1.25rem]  text-xs leading-5 text-gray-600",
          styleFieldToClassName(
            $props.appearance?.allowedContent,
            styleFieldArg,
          ),
        )}
        style={styleFieldToCssObject(
          $props.appearance?.allowedContent,
          styleFieldArg,
        )}
        data-state={state()}
        data-ut-element="allowed-content"
      >
        {contentFieldToContent($props.content?.allowedContent, styleFieldArg) ??
          allowedContentTextLabelGenerator(
            uploadedThing.permittedFileInfo()?.config,
          )}
      </div>
    </div>
  );
}
