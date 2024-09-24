import { fromEvent } from "file-selector";
import * as Vue from "vue";
import { computed, reactive, ref, watch } from "vue";
import type { HTMLAttributes, InputHTMLAttributes, ReservedProps } from "vue";
import { onMounted, onUnmounted, toRefs } from "vue";

import type {
  ContentField,
  DropzoneOptions,
  StyleField,
} from "@uploadthing/shared";
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
import type { FileRouter } from "uploadthing/server";

import type {
  GenerateTypedHelpersOptions,
  UploadthingComponentProps,
  UseUploadthingProps,
} from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { Cancel, progressWidths, Spinner, usePaste } from "./shared";

export type DropzoneStyleFieldCallbackArgs = {
  __runtime: "vue";
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
  isDragActive: boolean;
};

export type DropzoneAppearance = {
  container?: StyleField<DropzoneStyleFieldCallbackArgs>;
  uploadIcon?: StyleField<DropzoneStyleFieldCallbackArgs>;
  label?: StyleField<DropzoneStyleFieldCallbackArgs>;
  allowedContent?: StyleField<DropzoneStyleFieldCallbackArgs>;
  button?: StyleField<DropzoneStyleFieldCallbackArgs>;
};

export type DropzoneContent = {
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

export const generateUploadDropzone = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg(initOpts?.url),
  });

  return Vue.defineComponent(
    <TEndpoint extends keyof TRouter>(props: {
      config: UploadDropzoneProps<TRouter, TEndpoint>;
    }) => {
      const $props = props.config;

      const {
        mode = "auto",
        appendOnPaste = false,
        cn = defaultClassListMerger,
      } = $props.config ?? {};

      const acRef = ref(new AbortController());
      const files = ref<File[]>([]);
      const uploadProgress = ref(0);

      const useUploadthingProps: UseUploadthingProps<TRouter, TEndpoint> =
        reactive({
          signal: acRef.value.signal,
          headers: $props.headers,
          onClientUploadComplete: (res) => {
            files.value = [];
            $props.onClientUploadComplete?.(res);
            uploadProgress.value = 0;
          },
          onUploadProgress: (p) => {
            uploadProgress.value = p;
            $props.onUploadProgress?.(p);
          },
          onUploadError: $props.onUploadError,
          onUploadBegin: $props.onUploadBegin,
          onBeforeUploadBegin: $props.onBeforeUploadBegin,
        });
      const { startUpload, isUploading, routeConfig } = useUploadThing(
        $props.endpoint,
        useUploadthingProps,
      );

      const uploadFiles = async (files: File[]) => {
        const input = "input" in $props ? $props.input : undefined;

        await startUpload(files, input).catch((e) => {
          if (e instanceof UploadAbortedError) {
            void $props.onUploadAborted?.();
          } else {
            throw e;
          }
        });
      };

      const permittedFileTypes = computed(() =>
        generatePermittedFileTypes(routeConfig.value),
      );
      const ready = computed(
        () => permittedFileTypes.value.fileTypes.length > 0,
      );
      const acceptedFileTypes = computed(() =>
        generateClientDropzoneAccept(permittedFileTypes.value.fileTypes),
      );

      const onDrop = (acceptedFiles: File[]) => {
        // don't trigger onChange if no files are accepted
        if (acceptedFiles.length === 0) return;

        $props.onDrop?.(acceptedFiles);
        $props.onChange?.(acceptedFiles);

        files.value = acceptedFiles;

        // If mode is auto, start upload immediately.
        if (mode === "auto") void uploadFiles(acceptedFiles);
      };

      const dropzoneOptions: DropzoneOptions = reactive({
        onDrop: onDrop,
        accept: acceptedFileTypes.value,
        multiple: permittedFileTypes.value.multiple,
        disabled:
          $props.disabled ?? permittedFileTypes.value.fileTypes.length === 0,
      });
      watch(
        () => acceptedFileTypes.value,
        (newVal) => {
          dropzoneOptions.accept = newVal;
        },
      );
      watch(
        () => permittedFileTypes.value,
        (newVal) => {
          dropzoneOptions.multiple = newVal.multiple;
          dropzoneOptions.disabled =
            $props.disabled ?? newVal.fileTypes.length === 0;
        },
      );
      const { getRootProps, getInputProps, isDragActive, rootRef } =
        useDropzone(dropzoneOptions);

      const onUploadClick = async (e: MouseEvent) => {
        if (state.value === "uploading") {
          e.preventDefault();
          e.stopPropagation();

          acRef.value.abort();
          acRef.value = new AbortController();
          return;
        }
        if (mode === "manual" && files.value.length > 0) {
          e.preventDefault();
          e.stopPropagation();

          await uploadFiles(files.value);
        }
      };

      usePaste((event) => {
        if (!appendOnPaste) return;
        if (document.activeElement !== rootRef.value) return;

        const pastedFiles = getFilesFromClipboardEvent(event);
        if (!pastedFiles) return;

        files.value = [...files.value, ...pastedFiles];

        $props.onChange?.(files.value);

        if (mode === "auto") void uploadFiles(files.value);
      });

      const styleFieldArg = computed(
        () =>
          ({
            ready: state.value === "ready",
            isUploading: state.value === "uploading",
            uploadProgress: uploadProgress.value,
            fileTypes: permittedFileTypes.value.fileTypes,
            isDragActive: isDragActive.value,
          }) as DropzoneStyleFieldCallbackArgs,
      );

      const state = computed(() => {
        if (dropzoneOptions.disabled) return "disabled";
        if (!ready.value) return "readying";
        if (ready.value && !isUploading.value) return "ready";
        return "uploading";
      });

      const renderUploadIcon = () => {
        const customContent = contentFieldToContent(
          $props.content?.uploadIcon,
          styleFieldArg.value,
        );
        if (customContent) return customContent;

        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            class={cn(
              "mx-auto block h-12 w-12 align-middle text-gray-400",
              styleFieldToClassName(
                $props.appearance?.uploadIcon,
                styleFieldArg.value,
              ),
            )}
            style={styleFieldToCssObject(
              $props.appearance?.uploadIcon,
              styleFieldArg.value,
            )}
            data-ut-element="upload-icon"
            data-state={state.value}
          >
            <path
              fill="currentColor"
              fill-rule="evenodd"
              d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
              clip-rule="evenodd"
            ></path>
          </svg>
        );
      };

      const labelContent = computed(() => {
        const customContent = contentFieldToContent(
          $props.content?.label,
          styleFieldArg.value,
        );
        if (customContent) return customContent;

        return `Choose ${dropzoneOptions.multiple ? "file(s)" : "a file"} or drag and drop`;
      });

      const renderAllowedContent = () => {
        const customContent = contentFieldToContent(
          $props.content?.allowedContent,
          styleFieldArg.value,
        );
        if (customContent) return customContent;

        return (
          allowedContentTextLabelGenerator(routeConfig.value) || " " // ensure no empty string
        );
      };

      const renderButton = () => {
        const customContent = contentFieldToContent(
          $props.content?.button,
          styleFieldArg.value,
        );
        if (customContent) return customContent;

        if (state.value === "uploading") {
          if (uploadProgress.value === 100) {
            return <Spinner />;
          } else {
            return (
              <span class="z-50">
                <span class="block group-hover:hidden">
                  {uploadProgress.value}%
                </span>
                <Cancel cn={cn} class="hidden size-4 group-hover:block" />
              </span>
            );
          }
        } else {
          // Default case: "ready" or "disabled" state
          if (mode === "manual" && files.value.length > 0) {
            return `Upload ${files.value.length} file${files.value.length === 1 ? "" : "s"}`;
          } else {
            return `Choose File${getInputProps().multiple ? `(s)` : ``}`;
          }
        }
      };

      const containerClass = computed(() =>
        cn(
          "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
          isDragActive.value && "bg-blue-600/10",
          $props.class,
          styleFieldToClassName(
            $props.appearance?.container,
            styleFieldArg.value,
          ),
        ),
      );
      const labelClass = computed(() =>
        cn(
          "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
          state.value === "ready" ? "text-blue-600" : "text-gray-500",
          styleFieldToClassName($props.appearance?.label, styleFieldArg.value),
        ),
      );
      const allowedContentClass = computed(() =>
        cn(
          "m-0 h-[1.25rem] text-xs leading-5 text-gray-600",
          styleFieldToClassName(
            $props.appearance?.allowedContent,
            styleFieldArg.value,
          ),
        ),
      );
      const buttonClass = computed(() =>
        cn(
          "group relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state.value === "disabled" && "cursor-not-allowed bg-blue-400",
          state.value === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress.value]}`,
          state.value === "ready" && "bg-blue-600",
          "disabled:pointer-events-none",
          styleFieldToClassName($props.appearance?.button, styleFieldArg.value),
        ),
      );

      const containerStyle = computed(() =>
        styleFieldToCssObject(
          $props.appearance?.container,
          styleFieldArg.value,
        ),
      );
      const labelStyle = computed(() =>
        styleFieldToCssObject($props.appearance?.label, styleFieldArg.value),
      );
      const allowedContentStyle = computed(() =>
        styleFieldToCssObject(
          $props.appearance?.allowedContent,
          styleFieldArg.value,
        ),
      );
      const buttonStyle = computed(() =>
        styleFieldToCssObject($props.appearance?.button, styleFieldArg.value),
      );

      return () => {
        return (
          <div
            {...getRootProps()}
            class={containerClass.value}
            style={containerStyle.value}
            data-state={state.value}
          >
            {renderUploadIcon()}
            <label
              class={labelClass.value}
              style={labelStyle.value}
              data-ut-element="label"
              data-state={state.value}
            >
              <input class="sr-only" {...getInputProps()} />
              {labelContent.value}
            </label>
            <div
              class={allowedContentClass.value}
              style={allowedContentStyle.value}
              data-ut-element="allowed-content"
              data-state={state.value}
            >
              {renderAllowedContent()}
            </div>

            <button
              class={buttonClass.value}
              style={buttonStyle.value}
              onClick={onUploadClick}
              data-ut-element="button"
              data-state={state.value}
              type="button"
              disabled={files.value.length === 0 || state.value === "disabled"}
            >
              {renderButton()}
            </button>
          </div>
        );
      };
    },
    {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      props: ["config"] as any,
    },
  );
};

export type DropEvent = InputEvent | DragEvent | Event;

export function useDropzone(options: DropzoneOptions) {
  const optionsRef = ref({
    disabled: false,
    maxSize: Number.POSITIVE_INFINITY,
    minSize: 0,
    multiple: true,
    maxFiles: 0,
    ...options,
  });
  watch(
    () => ({ ...options }),
    (value) => {
      optionsRef.value = { ...optionsRef.value, ...value };
    },
  );

  const acceptAttr = computed(() =>
    acceptPropAsAcceptAttr(optionsRef.value.accept),
  );

  const rootRef = ref<HTMLElement>();
  const inputRef = ref<HTMLInputElement>();
  const dragTargets = ref<HTMLElement[]>([]);

  const state = reactive(initialState);

  const onWindowFocus = () => {
    if (state.isFileDialogActive) {
      setTimeout(() => {
        if (inputRef.value) {
          const { files } = inputRef.value;

          if (!files?.length) {
            state.isFileDialogActive = false;
          }
        }
      }, 300);
    }
  };

  const onDocumentDrop = (event: DropEvent) => {
    if (rootRef.value?.contains(event.target as Node)) {
      // If we intercepted an event for our instance, let it propagate down to the instance's onDrop handler
      return;
    }
    event.preventDefault();
    dragTargets.value = [];
  };

  const onDocumentDragOver = (e: Pick<Event, "preventDefault">) => {
    e.preventDefault();
  };

  onMounted(() => {
    window.addEventListener("focus", onWindowFocus, false);
    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);
  });
  onUnmounted(() => {
    window.removeEventListener("focus", onWindowFocus, false);
    document.removeEventListener("dragover", onDocumentDragOver, false);
    document.removeEventListener("drop", onDocumentDrop, false);
  });

  const onDragenter = (event: DragEvent) => {
    event.preventDefault();

    dragTargets.value = [...dragTargets.value, event.target as HTMLElement];

    if (isEventWithFiles(event)) {
      Promise.resolve(fromEvent(event))
        .then((files) => {
          if (isPropagationStopped(event)) return;

          const fileCount = files.length;
          const isDragAccept =
            fileCount > 0 &&
            allFilesAccepted({
              files: files as File[],
              accept: acceptAttr.value!,
              minSize: optionsRef.value.minSize,
              maxSize: optionsRef.value.maxSize,
              multiple: optionsRef.value.multiple,
              maxFiles: optionsRef.value.maxFiles,
            });
          const isDragReject = fileCount > 0 && !isDragAccept;

          state.isDragAccept = isDragAccept;
          state.isDragReject = isDragReject;
          state.isDragActive = true;
        })
        .catch(noop);
    }
  };

  const onDragover = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const hasFiles = isEventWithFiles(event);
    if (hasFiles && event.dataTransfer) {
      try {
        event.dataTransfer.dropEffect = "copy";
      } catch (err) {
        noop();
      }
    }

    return false;
  };

  const onDragleave = (event: DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Only deactivate once the dropzone and all children have been lef
    const targets = dragTargets.value.filter((target) =>
      rootRef.value?.contains(target),
    );

    // Make sure to remove a target present multiple times only once
    // (Firefox may fire dragenter/dragleave multiple times on the same element)
    const targetIdx = targets.indexOf(event.target as HTMLElement);
    if (targetIdx !== -1) {
      targets.splice(targetIdx, 1);
    }
    dragTargets.value = targets;
    if (targets.length > 0) {
      return;
    }

    state.isDragActive = false;
    state.isDragAccept = false;
    state.isDragReject = false;
  };

  const setFiles = (files: File[]) => {
    const acceptedFiles: File[] = [];

    files.forEach((file) => {
      const accepted = isFileAccepted(file, acceptAttr.value!);
      const sizeMatch = isValidSize(
        file,
        optionsRef.value.minSize,
        optionsRef.value.maxSize,
      );

      if (accepted && sizeMatch) {
        acceptedFiles.push(file);
      }
    });

    if (
      !isValidQuantity(
        acceptedFiles,
        optionsRef.value.multiple,
        optionsRef.value.maxFiles,
      )
    ) {
      acceptedFiles.splice(0);
    }

    state.acceptedFiles = acceptedFiles;
    state.isFileDialogActive = false;
    optionsRef.value.onDrop?.(acceptedFiles);
  };

  const onDrop = (event: DropEvent) => {
    event.preventDefault();

    dragTargets.value = [];

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

    Object.assign(state, initialState);
  };

  const openFileDialog = () => {
    if (inputRef.value) {
      inputRef.value.value = "";
      inputRef.value.click();
      state.isFileDialogActive = true;
    }
  };

  const onKeydown = (event: KeyboardEvent) => {
    // Ignore keyboard events bubbling up the DOM tree
    if (!rootRef.value?.isEqualNode(event.target as Node)) {
      return;
    }

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

  const onFocus = () => (state.isFocused = true);
  const onBlur = () => (state.isFocused = false);
  const onClick = () => {
    // In IE11/Edge the file-browser dialog is blocking, therefore, use setTimeout()
    // to ensure React can handle state changes
    // See: https://github.com/react-dropzone/react-dropzone/issues/450
    isIeOrEdge() ? setTimeout(openFileDialog, 0) : openFileDialog();
  };

  const getRootProps = (): HTMLAttributes & ReservedProps => ({
    ref: rootRef,
    role: "presentation" as const,
    ...(!optionsRef.value.disabled
      ? ({
          tabindex: 0,
          onKeydown,
          onFocus,
          onBlur,
          onClick,
          onDragenter,
          onDragover,
          onDragleave,
          onDrop,
        } satisfies HTMLAttributes & ReservedProps)
      : {}),
  });

  const getInputProps = (): InputHTMLAttributes & ReservedProps => ({
    ref: inputRef,
    type: "file",
    style: "display: none",
    accept: acceptAttr.value ?? "", // exactOptionalPropertyTypes: true
    multiple: optionsRef.value.multiple,
    tabindex: -1,
    ...(!optionsRef.value.disabled
      ? ({
          onChange: onDrop,
          onClick: onInputElementClick,
        } satisfies InputHTMLAttributes & ReservedProps)
      : {}),
  });

  return {
    ...toRefs(state),
    getInputProps,
    getRootProps,
    rootRef,
    inputRef,
  };
}
