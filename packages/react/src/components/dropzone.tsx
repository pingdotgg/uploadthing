"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  DragEvent,
  HTMLProps,
  KeyboardEvent,
  MouseEvent,
} from "react";
import { fromEvent } from "file-selector";

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
  isValidQuantity,
  isValidSize,
  noop,
  reducer,
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

import type { UploadthingComponentProps } from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { Cancel, progressWidths, Spinner } from "./shared";

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
> = UploadthingComponentProps<TRouter, TEndpoint> & {
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
  /**
   * Callback called when files are dropped or pasted.
   *
   * @param acceptedFiles - The files that were accepted.
   * @deprecated Use `onChange` instead
   */
  onDrop?: (acceptedFiles: File[]) => void;
};

/** These are some internal stuff we use to test the component and for forcing a state in docs */
type UploadThingInternalProps = {
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

export function UploadDropzone<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadDropzoneProps<TRouter, TEndpoint>,
) {
  // Cast back to UploadthingComponentProps<TRouter> to get the correct type
  // since the ErrorMessage messes it up otherwise
  const $props = props as unknown as UploadDropzoneProps<TRouter, TEndpoint> &
    UploadThingInternalProps;
  const fileRouteInput = "input" in $props ? $props.input : undefined;

  const {
    mode = "manual",
    appendOnPaste = false,
    cn = defaultClassListMerger,
  } = $props.config ?? {};
  const acRef = useRef(new AbortController());

  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg($props.url),
  });

  const [files, setFiles] = useState<File[]>([]);

  const [uploadProgressState, setUploadProgress] = useState(
    $props.__internal_upload_progress ?? 0,
  );
  const uploadProgress =
    $props.__internal_upload_progress ?? uploadProgressState;
  const { startUpload, isUploading, routeConfig } = useUploadThing(
    $props.endpoint,
    {
      signal: acRef.current.signal,
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
    },
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      await startUpload(files, fileRouteInput).catch((e) => {
        if (e instanceof UploadAbortedError) {
          void $props.onUploadAborted?.();
        } else {
          throw e;
        }
      });
    },
    [$props, startUpload, fileRouteInput],
  );

  const { fileTypes, multiple } = generatePermittedFileTypes(routeConfig);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      $props.onDrop?.(acceptedFiles);
      $props.onChange?.(acceptedFiles);

      setFiles(acceptedFiles);

      // If mode is auto, start upload immediately
      if (mode === "auto") void uploadFiles(acceptedFiles);
    },
    [$props, mode, uploadFiles],
  );

  const isDisabled = (() => {
    if ($props.__internal_dropzone_disabled) return true;
    if ($props.disabled) return true;

    return false;
  })();

  const { getRootProps, getInputProps, isDragActive, rootRef } = useDropzone({
    onDrop,
    multiple,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    disabled: isDisabled,
  });

  const ready =
    $props.__internal_ready ??
    ($props.__internal_state === "ready" || fileTypes.length > 0);

  const onUploadClick = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    if (state === "uploading") {
      e.preventDefault();
      e.stopPropagation();

      acRef.current.abort();
      acRef.current = new AbortController();
      return;
    }
    if (mode === "manual" && files.length > 0) {
      e.preventDefault();
      e.stopPropagation();

      await uploadFiles(files);
    }
  };

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!appendOnPaste) return;
      if (document.activeElement !== rootRef.current) return;

      const pastedFiles = getFilesFromClipboardEvent(event);
      if (!pastedFiles?.length) return;

      let filesToUpload = pastedFiles;
      setFiles((prev) => {
        filesToUpload = [...prev, ...pastedFiles];

        $props.onChange?.(filesToUpload);

        return filesToUpload;
      });

      $props.onChange?.(filesToUpload);

      if (mode === "auto") void uploadFiles(filesToUpload);
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [uploadFiles, $props, appendOnPaste, mode, fileTypes, rootRef, files]);

  const getUploadButtonContents = () => {
    const customContent = contentFieldToContent(
      $props.content?.button,
      styleFieldArg,
    );
    if (customContent) return customContent;

    switch (state) {
      case "readying": {
        return "Loading...";
      }
      case "uploading": {
        if (uploadProgress === 100) return <Spinner />;
        return (
          <span className="z-50">
            <span className="block group-hover:hidden">{uploadProgress}%</span>
            <Cancel cn={cn} className="hidden size-4 group-hover:block" />
          </span>
        );
      }
      case "disabled":
      case "ready":
      default: {
        if (mode === "manual" && files.length > 0) {
          return `Upload ${files.length} file${files.length === 1 ? "" : "s"}`;
        }
        return `Choose File${multiple ? `(s)` : ``}`;
      }
    }
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
    if (isDisabled) return "disabled";
    if (!ready) return "readying";
    if (ready && !isUploading) return "ready";

    return "uploading";
  })();

  return (
    <div
      className={cn(
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
          className={cn(
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
        className={cn(
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
          (ready
            ? `Choose ${multiple ? "file(s)" : "a file"} or drag and drop`
            : `Loading...`)}
      </label>
      <div
        className={cn(
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
        className={cn(
          "group relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state === "disabled" && "cursor-not-allowed bg-blue-400",
          state === "readying" && "cursor-not-allowed bg-blue-400",
          state === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
          state === "ready" && "bg-blue-600",
          "disabled:pointer-events-none",
          styleFieldToClassName($props.appearance?.button, styleFieldArg),
        )}
        style={styleFieldToCssObject($props.appearance?.button, styleFieldArg)}
        onClick={onUploadClick as any}
        data-ut-element="button"
        data-state={state}
        type="button"
        disabled={$props.__internal_button_disabled ?? !files.length}
      >
        {getUploadButtonContents()}
      </button>
    </div>
  );
}

export type DropEvent =
  | Event
  | React.DragEvent<HTMLElement>
  | React.ChangeEvent<HTMLElement>;

/**
 * A React hook that creates a drag 'n' drop area.
 *
 * ### Example
 *
 * ```tsx
 * function MyDropzone() {
 *   const { getRootProps, getInputProps } = useDropzone({
 *     onDrop: acceptedFiles => {
 *       // do something with the File objects, e.g. upload to some server
 *     }
 *   });
 *
 *   return (
 *     <div {...getRootProps()}>
 *       <input {...getInputProps()} />
 *       <p>Drag and drop some files here, or click to select files</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useDropzone({
  accept,
  disabled = false,
  maxSize = Number.POSITIVE_INFINITY,
  minSize = 0,
  multiple = true,
  maxFiles = 0,
  onDrop,
}: DropzoneOptions) {
  const acceptAttr = useMemo(() => acceptPropAsAcceptAttr(accept), [accept]);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragTargetsRef = useRef<EventTarget[]>([]);

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // Update file dialog active state when the window is focused on
    const onWindowFocus = () => {
      // Execute the timeout only if the file dialog is opened in the browser
      if (state.isFileDialogActive) {
        setTimeout(() => {
          if (inputRef.current) {
            const { files } = inputRef.current;

            if (!files?.length) {
              dispatch({ type: "closeDialog" });
            }
          }
        }, 300);
      }
    };

    window.addEventListener("focus", onWindowFocus, false);
    return () => {
      window.removeEventListener("focus", onWindowFocus, false);
    };
  }, [state.isFileDialogActive]);

  useEffect(() => {
    const onDocumentDrop = (event: DropEvent) => {
      // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
      if (rootRef.current?.contains(event.target as Node)) return;

      event.preventDefault();
      dragTargetsRef.current = [];
    };
    const onDocumentDragOver = (e: Pick<Event, "preventDefault">) =>
      e.preventDefault();

    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);

    return () => {
      document.removeEventListener("dragover", onDocumentDragOver);
      document.removeEventListener("drop", onDocumentDrop);
    };
  }, []);

  const onDragEnter = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.persist();

      dragTargetsRef.current = [...dragTargetsRef.current, event.target];

      if (isEventWithFiles(event)) {
        Promise.resolve(fromEvent(event))
          .then((files) => {
            if (event.isPropagationStopped()) return;

            const fileCount = files.length;
            const isDragAccept =
              fileCount > 0 &&
              allFilesAccepted({
                files: files as File[],
                accept: acceptAttr!,
                minSize,
                maxSize,
                multiple,
                maxFiles,
              });
            const isDragReject = fileCount > 0 && !isDragAccept;

            dispatch({
              type: "setDraggedFiles",
              payload: {
                isDragAccept,
                isDragReject,
                isDragActive: true,
              },
            });
          })
          .catch(noop);
      }
    },
    [acceptAttr, maxFiles, maxSize, minSize, multiple],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.persist();

    const hasFiles = isEventWithFiles(event);
    if (hasFiles && event.dataTransfer !== null) {
      try {
        event.dataTransfer.dropEffect = "copy";
      } catch {
        noop();
      }
    }

    return false;
  }, []);

  const onDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    event.persist();

    // Only deactivate once the dropzone and all children have been left
    const targets = dragTargetsRef.current.filter((target) =>
      rootRef.current?.contains(target as Node),
    );

    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target);
    if (targetIdx !== -1) targets.splice(targetIdx, 1);
    dragTargetsRef.current = targets;
    if (targets.length > 0) return;

    dispatch({
      type: "setDraggedFiles",
      payload: {
        isDragActive: false,
        isDragAccept: false,
        isDragReject: false,
      },
    });
  }, []);

  const setFiles = useCallback(
    (files: File[]) => {
      const acceptedFiles: File[] = [];

      files.forEach((file) => {
        const accepted = isFileAccepted(file, acceptAttr!);
        const sizeMatch = isValidSize(file, minSize, maxSize);

        if (accepted && sizeMatch) {
          acceptedFiles.push(file);
        }
      });

      if (!isValidQuantity(acceptedFiles, multiple, maxFiles)) {
        acceptedFiles.splice(0);
      }

      dispatch({
        type: "setFiles",
        payload: {
          acceptedFiles,
        },
      });

      onDrop(acceptedFiles);
    },
    [acceptAttr, maxFiles, maxSize, minSize, multiple, onDrop],
  );

  const onDropCb = useCallback(
    (event: ChangeEvent<HTMLElement>) => {
      event.preventDefault();
      event.persist();

      dragTargetsRef.current = [];

      if (isEventWithFiles(event)) {
        Promise.resolve(fromEvent(event))
          .then((files) => {
            if (event.isPropagationStopped()) return;
            setFiles(files as File[]);
          })
          .catch(noop);
      }
      dispatch({ type: "reset" });
    },
    [setFiles],
  );

  const openFileDialog = useCallback(() => {
    if (inputRef.current) {
      dispatch({ type: "openDialog" });
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }, []);

  // Cb to open the file dialog when SPACE/ENTER occurs on the dropzone
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore keyboard events bubbling up the DOM tree
      if (!rootRef.current?.isEqualNode(event.target as Node)) return;

      if (isEnterOrSpace(event)) {
        event.preventDefault();
        openFileDialog();
      }
    },
    [openFileDialog],
  );

  const onInputElementClick = useCallback((e: MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Update focus state for the dropzone
  const onFocus = useCallback(() => dispatch({ type: "focus" }), []);
  const onBlur = useCallback(() => dispatch({ type: "blur" }), []);

  const onClick = useCallback(() => {
    // In IE11/Edge the file-browser dialog is blocking, therefore,
    // use setTimeout() to ensure React can handle state changes
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  }, [openFileDialog]);

  const getRootProps = useMemo(
    () => (): HTMLProps<HTMLDivElement> => ({
      ref: rootRef,
      role: "presentation",
      ...(!disabled
        ? {
            tabIndex: 0,
            onKeyDown,
            onFocus,
            onBlur,
            onClick,
            onDragEnter,
            onDragOver,
            onDragLeave,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            onDrop: onDropCb as any,
          }
        : {}),
    }),
    [
      disabled,
      onBlur,
      onClick,
      onDragEnter,
      onDragLeave,
      onDragOver,
      onDropCb,
      onFocus,
      onKeyDown,
    ],
  );

  const getInputProps = useMemo(
    () => (): HTMLProps<HTMLInputElement> => ({
      ref: inputRef,
      type: "file",
      style: { display: "none" },
      accept: acceptAttr,
      multiple,
      tabIndex: -1,
      ...(!disabled
        ? {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            onChange: onDropCb as any,
            onClick: onInputElementClick,
          }
        : {}),
    }),
    [acceptAttr, multiple, onDropCb, onInputElementClick, disabled],
  );

  return {
    ...state,
    getRootProps,
    getInputProps,
    rootRef,
  };
}
