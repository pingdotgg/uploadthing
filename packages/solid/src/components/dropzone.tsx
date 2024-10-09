import { fromEvent } from "file-selector";
import {
  createEffect,
  createMemo,
  createSignal,
  Match,
  mergeProps,
  onCleanup,
  Show,
  Switch,
} from "solid-js";
import { createStore } from "solid-js/store";

import {
  acceptPropAsAcceptAttr,
  allFilesAccepted,
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  defaultClassListMerger,
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
  getFilesFromClipboardEvent,
  initialState,
  isEnterOrSpace,
  isEventWithFiles,
  isFileAccepted,
  isIeOrEdge,
  isPropagationStopped,
  isValidQuantity,
  isValidSize,
  noop,
  resolveMaybeUrlArg,
  styleFieldToClassName,
  styleFieldToCssObject,
  UploadAbortedError,
} from "@uploadthing/shared";
import type {
  ContentField,
  DropzoneOptions,
  ErrorMessage,
  StyleField,
} from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/types";

import { INTERNAL_createUploadThingGen } from "../create-uploadthing";
import type { UploadthingComponentProps } from "../types";
import { Cancel, progressWidths, Spinner } from "./shared";

type DropzoneStyleFieldCallbackArgs = {
  __runtime: "solid";
  ready: () => boolean;
  isUploading: () => boolean;
  uploadProgress: () => number;
  fileTypes: () => string[];
  isDragActive: () => boolean;
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
> = UploadthingComponentProps<TRouter, TEndpoint> & {
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-classname-prop
   */
  class?: string;
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-appearance-prop
   */
  appearance?: DropzoneAppearance;
  /**
   * @see https://docs.uploadthing.com/theming#content-customisation
   */
  content?: DropzoneContent;
  /**
   * Callback called when files are dropped or pasted.
   *
   * @param acceptedFiles - The files that were accepted.
   * @deprecated Use `onChange` instead
   */
  onDrop?: (acceptedFiles: File[]) => void;
};

export const UploadDropzone = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadDropzoneProps<TRouter, TEndpoint>,
) => {
  const $props = props as UploadDropzoneProps<TRouter, TEndpoint>;
  const createUploadThing = INTERNAL_createUploadThingGen<TRouter>({
    url: resolveMaybeUrlArg($props.url),
  });

  const {
    mode = "manual",
    appendOnPaste = false,
    cn = defaultClassListMerger,
  } = $props.config ?? {};
  let acRef = new AbortController();
  let rootRef: HTMLElement;

  const [files, setFiles] = createSignal<File[]>([]);
  const [uploadProgress, setUploadProgress] = createSignal(0);

  const uploadThing = createUploadThing($props.endpoint, {
    signal: acRef.signal,
    headers: $props.headers,
    onClientUploadComplete: (res) => {
      setFiles([]);
      void $props.onClientUploadComplete?.(res);
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

  const state = () => {
    const ready = fileInfo().fileTypes.length > 0;

    if ($props.disabled) return "disabled";
    if (!ready) return "readying";
    if (ready && !uploadThing.isUploading()) return "ready";
    return "uploading";
  };

  const uploadFiles = (files: File[]) => {
    const input = "input" in $props ? $props.input : undefined;
    uploadThing.startUpload(files, input).catch((e) => {
      if (e instanceof UploadAbortedError) {
        void $props.onUploadAborted?.();
      } else {
        throw e;
      }
    });
  };

  const onUploadClick = (e: MouseEvent) => {
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

      uploadFiles(files());
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    $props.onDrop?.(acceptedFiles);
    $props.onChange?.(acceptedFiles);

    setFiles(acceptedFiles);

    // If mode is auto, start upload immediately
    if (mode === "auto") uploadFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = createDropzone({
    onDrop,
    multiple: fileInfo().multiple,
    get accept() {
      const types = fileInfo().fileTypes;
      return types ? generateClientDropzoneAccept(types) : undefined;
    },
    disabled: $props.disabled,
  });

  createEffect(() => {
    if (!appendOnPaste) return;

    const pasteHandler = (e: ClipboardEvent) => {
      if (document.activeElement !== rootRef) return;

      const pastedFiles = getFilesFromClipboardEvent(e);
      if (!pastedFiles) return;

      setFiles((prevFiles) => [...prevFiles, ...pastedFiles]);

      $props.onChange?.(files());

      if (mode === "auto") uploadFiles(files());
    };
    document?.addEventListener("paste", pasteHandler);

    onCleanup(() => {
      document?.removeEventListener("paste", pasteHandler);
    });
  });

  const styleFieldArg = {
    ready: () => state() !== "readying",
    isUploading: uploadThing.isUploading,
    uploadProgress: uploadProgress,
    fileTypes: () => fileInfo().fileTypes,
    isDragActive: () => isDragActive,
  } as DropzoneStyleFieldCallbackArgs;

  return (
    <div
      class={cn(
        "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
        isDragActive && "bg-blue-600/10",
        $props.class,
        styleFieldToClassName($props.appearance?.container, styleFieldArg),
      )}
      {...getRootProps()}
      ref={(el) => (rootRef = el)}
      style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
      data-state={state()}
    >
      {contentFieldToContent($props.content?.uploadIcon, styleFieldArg) ?? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          class={cn(
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
        class={cn(
          "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
          state() === "ready" ? "text-blue-600" : "text-gray-500",
          styleFieldToClassName($props.appearance?.label, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.label, styleFieldArg)}
        data-ut-element="label"
        data-state={state()}
      >
        <input class="sr-only" {...getInputProps()} />
        {contentFieldToContent($props.content?.label, styleFieldArg) ??
          (state() === "ready"
            ? `Choose ${fileInfo().multiple ? "file(s)" : "a file"} or drag and drop`
            : `Loading...`)}
      </label>
      <div
        class={cn(
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
          allowedContentTextLabelGenerator(uploadThing.routeConfig())}
      </div>

      <button
        class={cn(
          "group relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state() === "disabled" && "cursor-not-allowed bg-blue-400",
          state() === "readying" && "cursor-not-allowed bg-blue-400",
          state() === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${
              progressWidths[uploadProgress()]
            }`,
          state() === "ready" && "bg-blue-600",
          "disabled:pointer-events-none",
          styleFieldToClassName($props.appearance?.button, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.button, styleFieldArg)}
        onClick={onUploadClick}
        data-ut-element="button"
        data-state={state()}
        type="button"
        disabled={files().length === 0 || state() === "disabled"}
      >
        {contentFieldToContent($props.content?.button, styleFieldArg) ?? (
          <Switch
            fallback={
              <Show
                when={mode === "manual" && files().length > 0}
                fallback={<>Choose File{fileInfo().multiple ? "(s)" : ""}</>}
              >
                Upload {files().length} file{files().length === 1 ? "" : "s"}
              </Show>
            }
          >
            <Match when={state() === "readying"}>Loading...</Match>
            <Match when={state() === "uploading"}>
              <Show when={uploadProgress() < 100} fallback={<Spinner />}>
                <span class="z-50">
                  <span class="block group-hover:hidden">
                    {uploadProgress()}%
                  </span>
                  <Cancel cn={cn} class="hidden size-4 group-hover:block" />
                </span>
              </Show>
            </Match>
          </Switch>
        )}
      </button>
    </div>
  );
};

export type DropEvent = InputEvent | DragEvent | Event;

export function createDropzone(_props: DropzoneOptions) {
  const props = mergeProps(
    {
      disabled: false,
      maxSize: Number.POSITIVE_INFINITY,
      minSize: 0,
      multiple: true,
      maxFiles: 0,
    },
    _props,
  );

  const acceptAttr = createMemo(() => acceptPropAsAcceptAttr(props.accept));

  const [rootRef, setRootRef] = createSignal<HTMLElement | null>();
  const [inputRef, setInputRef] = createSignal<HTMLInputElement | null>();
  let dragTargets: HTMLElement[] = [];

  const [state, setState] = createStore(initialState);

  createEffect(() => {
    const onWindowFocus = () => {
      if (state.isFileDialogActive) {
        setTimeout(() => {
          const input = inputRef();
          if (input) {
            const { files } = input;

            if (!files?.length) {
              setState({ isFileDialogActive: false });
            }
          }
        }, 300);
      }
    };

    window.addEventListener("focus", onWindowFocus, false);
    onCleanup(() => {
      window.removeEventListener("focus", onWindowFocus, false);
    });
  });

  createEffect(() => {
    const onDocumentDrop = (event: DropEvent) => {
      const root = rootRef();

      // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
      if (root?.contains(event.target as Node)) return;

      event.preventDefault();
      dragTargets = [];
    };

    const onDocumentDragOver = (e: Pick<Event, "preventDefault">) =>
      e.preventDefault();

    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);

    onCleanup(() => {
      document.removeEventListener("dragover", onDocumentDragOver, false);
      document.removeEventListener("drop", onDocumentDrop, false);
    });
  });

  const onDragEnter = (event: DragEvent) => {
    event.preventDefault();

    dragTargets = [...dragTargets, event.target as HTMLElement];

    if (isEventWithFiles(event)) {
      Promise.resolve(fromEvent(event))
        .then((files) => {
          if (isPropagationStopped(event)) return;

          const fileCount = files.length;
          const isDragAccept =
            fileCount > 0 &&
            allFilesAccepted({
              files: files as File[],
              accept: acceptAttr()!,
              minSize: props.minSize,
              maxSize: props.maxSize,
              multiple: props.multiple,
              maxFiles: props.maxFiles,
            });
          const isDragReject = fileCount > 0 && !isDragAccept;

          setState({
            isDragAccept,
            isDragReject,
            isDragActive: true,
          });
        })
        .catch(noop);
    }
  };

  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const hasFiles = isEventWithFiles(event);
    if (hasFiles && event.dataTransfer) {
      try {
        event.dataTransfer.dropEffect = "copy";
      } catch {
        noop();
      }
    }

    return false;
  };

  const onDragLeave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const root = rootRef();
    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargets.filter((target) => root?.contains(target));
    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target as HTMLElement);
    if (targetIdx !== -1) {
      targets.splice(targetIdx, 1);
    }
    dragTargets = targets;
    if (targets.length > 0) {
      return;
    }

    setState({
      isDragActive: false,
      isDragAccept: false,
      isDragReject: false,
    });
  };

  const setFiles = (files: File[]) => {
    const acceptedFiles: File[] = [];

    files.forEach((file) => {
      const accepted = isFileAccepted(file, acceptAttr()!);
      const sizeMatch = isValidSize(file, props.minSize, props.maxSize);

      if (accepted && sizeMatch) {
        acceptedFiles.push(file);
      }
    });

    if (!isValidQuantity(acceptedFiles, props.multiple, props.maxFiles)) {
      acceptedFiles.splice(0);
    }

    setState({
      acceptedFiles,
      isFileDialogActive: false,
    });

    props.onDrop?.(acceptedFiles);
  };

  const onDrop = (event: DropEvent) => {
    event.preventDefault();

    dragTargets = [];

    if (isEventWithFiles(event)) {
      Promise.resolve(fromEvent(event))
        .then((files) => {
          if (isPropagationStopped(event)) {
            return;
          }
          setFiles(files as File[]);
        })
        .catch(noop);
    }

    setState(initialState);
  };

  const openFileDialog = () => {
    const input = inputRef();
    if (input) {
      input.value = "";
      input.click();
      setState({ isFileDialogActive: true });
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const root = rootRef();

    // Ignore keyboard events bubbling up the DOM tree
    if (!root?.isEqualNode(event.target as Node)) return;

    if (isEnterOrSpace(event)) {
      event.preventDefault();
      openFileDialog();
    }
  };

  const onInputElementClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (state.isFileDialogActive) {
      event.preventDefault();
    }
  };

  const onFocus = () => setState("isFocused", true);
  const onBlur = () => setState("isFocused", false);
  const onClick = () => {
    // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
    // to ensure React can handle state changes
    // See: https://github.com/react-dropzone/react-dropzone/issues/450
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  };

  const getRootProps = () => ({
    ref: setRootRef,
    role: "presentation" as const,
    ...(!props.disabled
      ? {
          tabIndex: 0,
          onKeyDown,
          onFocus,
          onBlur,
          onClick,
          onDragEnter,
          onDragOver,
          onDragLeave,
          onDrop,
        }
      : {}),
  });

  const getInputProps = () => ({
    ref: setInputRef,
    type: "file",
    style: { display: "none" },
    accept: acceptAttr(),
    multiple: props.multiple,
    tabIndex: -1,
    ...(!props.disabled
      ? {
          onChange: onDrop,
          onClick: onInputElementClick,
        }
      : {}),
  });

  return mergeProps(state, {
    getInputProps,
    getRootProps,
    rootRef: setRootRef,
    inputRef: setInputRef,
  });
}
