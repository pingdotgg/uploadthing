import { createSignal, onCleanup, onMount } from "solid-js";

import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  defaultClassListMerger,
  generateMimeTypes,
  generatePermittedFileTypes,
  getFilesFromClipboardEvent,
  resolveMaybeUrlArg,
  styleFieldToClassName,
  styleFieldToCssObject,
  UploadAbortedError,
} from "@uploadthing/shared";
import type {
  ContentField,
  ErrorMessage,
  StyleField,
} from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/types";

import { INTERNAL_createUploadThingGen } from "../create-uploadthing";
import type { UploadthingComponentProps } from "../types";
import { Cancel, progressWidths, Spinner } from "./shared";

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
  const [files, setFiles] = createSignal<File[]>([]);

  let inputRef: HTMLInputElement;
  const $props = props as UploadButtonProps<TRouter, TEndpoint>;

  const { cn = defaultClassListMerger } = $props.config ?? {};

  let acRef = new AbortController();

  const fileRouteInput = "input" in $props ? $props.input : undefined;

  const { mode = "auto", appendOnPaste = false } = $props.config ?? {};

  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg($props.url),
  });

  const uploadThing = createUploadThing($props.endpoint, {
    signal: acRef.signal,
    headers: $props.headers,
    onClientUploadComplete: (res) => {
      setFiles([]);
      inputRef.value = "";
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

  const fileInfo = () => generatePermittedFileTypes(uploadThing.routeConfig());

  const ready = () => fileInfo().fileTypes.length > 0;

  const styleFieldArg = {
    ready: ready,
    isUploading: uploadThing.isUploading,
    uploadProgress: uploadProgress,
    fileTypes: () => fileInfo().fileTypes,
  } as ButtonStyleFieldCallbackArgs;

  const state = () => {
    if (!ready()) return "readying";
    if (ready() && !uploadThing.isUploading()) return "ready";

    return "uploading";
  };

  const uploadFiles = async (files: File[]) => {
    await uploadThing.startUpload(files, fileRouteInput).catch((e) => {
      if (e instanceof UploadAbortedError) {
        void $props.onUploadAborted?.();
      } else {
        throw e;
      }
    });
  };

  const pasteHandler = (e: ClipboardEvent) => {
    if (!appendOnPaste) return;
    if (document?.activeElement !== inputRef) return;

    const pastedFiles = getFilesFromClipboardEvent(e);
    if (!pastedFiles) return;

    setFiles((prevFiles) => [...prevFiles, ...pastedFiles]);

    $props.onChange?.(files());

    if (mode === "auto") void uploadFiles(files());
  };

  // onMount will only be called client side, so it guarantees DOM APIs exist.
  onMount(() => {
    try {
      document?.addEventListener("paste", pasteHandler);
    } catch {
      // noop - we're not in a browser
    }
  });
  onCleanup(() => {
    try {
      document?.removeEventListener("paste", pasteHandler);
    } catch {
      // noop - we're not in a browser
    }
  });

  const getButtonContent = () => {
    const customContent = contentFieldToContent(
      $props.content?.button,
      styleFieldArg,
    );

    if (customContent) return customContent;

    if (state() === "readying") return "Loading...";

    if (state() !== "uploading") {
      if (mode === "manual" && files().length > 0) {
        return `Upload ${files().length} file${files().length === 1 ? "" : "s"}`;
      }
      return `Choose File${fileInfo().multiple ? `(s)` : ``}`;
    }

    if (uploadProgress() === 100) return <Spinner />;

    return (
      <span class="z-50">
        <span class="block group-hover:hidden">{uploadProgress()}%</span>
        <Cancel cn={cn} class="hidden size-4 group-hover:block" />
      </span>
    );
  };

  return (
    <div
      class={cn(
        "flex flex-col items-center justify-center gap-1",
        $props.class,
        styleFieldToClassName($props.appearance?.container, styleFieldArg),
      )}
      style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
      data-state={state()}
    >
      <label
        class={cn(
          "group relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
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
        onClick={async (e) => {
          if (state() === "uploading") {
            e.preventDefault();
            e.stopPropagation();

            acRef.abort();
            acRef = new AbortController();
            return;
          }
          if (mode === "manual" && files().length > 0) {
            e.preventDefault();
            e.stopPropagation();

            await uploadFiles(files());
          }
        }}
      >
        <input
          ref={(el) => (inputRef = el)}
          class="sr-only"
          type="file"
          multiple={fileInfo().multiple}
          accept={generateMimeTypes(fileInfo().fileTypes).join(", ")}
          onChange={async (e) => {
            if (!e.target.files) return;
            const selectedFiles = Array.from(e.target.files);

            $props.onChange?.(selectedFiles);

            if (mode === "manual") {
              setFiles(selectedFiles);
              return;
            }

            await uploadFiles(selectedFiles);
          }}
        />
        {getButtonContent()}
      </label>
      {mode === "manual" && files().length > 0 ? (
        <button
          onClick={() => {
            setFiles([]);
            inputRef.value = "";
            $props.onChange?.([]);
          }}
          class={cn(
            "h-[1.25rem] cursor-pointer rounded border-none bg-transparent text-gray-500 transition-colors hover:bg-slate-200 hover:text-gray-600",
            styleFieldToClassName($props.appearance?.clearBtn, styleFieldArg),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.clearBtn,
            styleFieldArg,
          )}
          data-state={state}
          data-ut-element="clear-btn"
        >
          {contentFieldToContent($props.content?.clearBtn, styleFieldArg) ??
            "Clear"}
        </button>
      ) : (
        <div
          class={cn(
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
          {contentFieldToContent(
            $props.content?.allowedContent,
            styleFieldArg,
          ) ?? allowedContentTextLabelGenerator(uploadThing.routeConfig())}
        </div>
      )}
    </div>
  );
}
