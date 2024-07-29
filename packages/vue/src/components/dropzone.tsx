import { twMerge } from "tailwind-merge";
import * as Vue from "vue";
import { computed, reactive, ref, watch } from "vue";

import type { DropzoneOptions } from "@uploadthing/dropzone/vue";
import { useDropzone } from "@uploadthing/dropzone/vue";
import type { ContentField, StyleField } from "@uploadthing/shared";
import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
  getFilesFromClipboardEvent,
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
import { progressWidths, Spinner, usePaste } from "./shared";

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
  TSkipPolling extends boolean = false,
> = UploadthingComponentProps<TRouter, TEndpoint, TSkipPolling> & {
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
    <
      TEndpoint extends keyof TRouter,
      TSkipPolling extends boolean = false,
    >(props: {
      disabled?: boolean;
      config: UploadDropzoneProps<TRouter, TEndpoint, TSkipPolling>;
    }) => {
      const $props = props.config;

      const { mode = "auto", appendOnPaste = false } = $props.config ?? {};

      const acRef = ref(new AbortController());
      const files = ref<File[]>([]);
      const uploadProgress = ref(0);

      const useUploadthingProps: UseUploadthingProps<
        TRouter,
        TEndpoint,
        TSkipPolling
      > = reactive({
        headers: $props.headers,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        skipPolling: !$props?.onClientUploadComplete
          ? true
          : ($props?.skipPolling as any),
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
      const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
        $props.endpoint,
        useUploadthingProps,
      );

      const permittedFileTypes = computed(() =>
        generatePermittedFileTypes(permittedFileInfo.value?.config),
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
          props.disabled ?? permittedFileTypes.value.fileTypes.length === 0,
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
          dropzoneOptions.disabled = newVal.fileTypes.length === 0;
        },
      );
      const { getRootProps, getInputProps, isDragActive, rootRef } =
        useDropzone(dropzoneOptions);

      const state = computed(() => {
        if (dropzoneOptions.disabled) return "disabled";
        if (!dropzoneOptions.disabled && !isUploading.value) return "ready";
        return "uploading";
      });

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
            class={twMerge(
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
            data-state={state}
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

        return `Choose files or drag and drop`;
      });

      const renderAllowedContent = () => {
        const customContent = contentFieldToContent(
          $props.content?.allowedContent,
          styleFieldArg.value,
        );
        if (customContent) return customContent;

        return (
          allowedContentTextLabelGenerator(permittedFileInfo.value?.config) ||
          " " // ensure no empty string
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
                <span class="block group-hover:hidden">{uploadProgress}%</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class={twMerge(
                    "fill-none stroke-current stroke-2",
                    "hidden size-4 group-hover:block",
                  )}
                  {...props}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="m4.9 4.9 14.2 14.2" />
                </svg>
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
        twMerge(
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
        twMerge(
          "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
          state.value === "ready" ? "text-blue-600" : "text-gray-500",
          styleFieldToClassName($props.appearance?.label, styleFieldArg.value),
        ),
      );
      const allowedContentClass = computed(() =>
        twMerge(
          "m-0 h-[1.25rem] text-xs leading-5 text-gray-600",
          styleFieldToClassName(
            $props.appearance?.allowedContent,
            styleFieldArg.value,
          ),
        ),
      );
      const buttonClass = computed(() =>
        twMerge(
          "relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
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
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!files.value) return;
                if (state.value === "uploading") {
                  acRef.value.abort();
                  acRef.value = new AbortController();
                  return;
                }

                await uploadFiles(files.value);
              }}
              data-ut-element="button"
              data-state={state.value}
              disabled={files.value.length === 0 || state.value === "uploading"}
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
