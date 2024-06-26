import { createSignal } from "solid-js";
import { twMerge } from "tailwind-merge";

import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  generateMimeTypes,
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

type ButtonStyleFieldCallbackArgs = {
  __runtime: "solid";
  ready: () => boolean;
  isUploading: () => boolean;
  uploadProgress: () => number;
  fileTypes: () => string[];
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
> = UploadthingComponentProps<TRouter, TEndpoint> & {
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-classname-prop
   */
  class?: string;
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-appearance-prop
   */
  appearance?: ButtonAppearance;
  /**
   * @see https://docs.uploadthing.com/theming#content-customisation
   */
  content?: ButtonContent;
};

/**
 * @example
 * <UploadButton<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(url) => console.log(url)}
 * />
 */
export function UploadButton<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadButtonProps<TRouter, TEndpoint>,
) {
  const [uploadProgress, setUploadProgress] = createSignal(0);
  let inputRef: HTMLInputElement;
  const $props = props as UploadButtonProps<TRouter, TEndpoint>;

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg($props.url),
  });

  const uploadedThing = useUploadThing($props.endpoint, {
    headers: $props.headers,
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
    onUploadBegin: $props.onUploadBegin,
    onBeforeUploadBegin: $props.onBeforeUploadBegin,
  });

  const fileInfo = () =>
    generatePermittedFileTypes(uploadedThing.permittedFileInfo()?.config);

  const ready = () => fileInfo().fileTypes.length > 0;

  const styleFieldArg = {
    ready: ready,
    isUploading: uploadedThing.isUploading,
    uploadProgress: uploadProgress,
    fileTypes: () => fileInfo().fileTypes,
  } as ButtonStyleFieldCallbackArgs;

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
          accept={generateMimeTypes(fileInfo().fileTypes).join(", ")}
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
          "h-[1.25rem] text-xs leading-5 text-gray-600",
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
