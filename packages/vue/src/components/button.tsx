import { twMerge } from "tailwind-merge";
import * as Vue from "vue";
import { computed, reactive, ref } from "vue";

import type { ContentField, StyleField } from "@uploadthing/shared";
import {
  allowedContentTextLabelGenerator,
  contentFieldToContent,
  generateMimeTypes,
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

export type ButtonStyleFieldCallbackArgs = {
  __runtime: "vue";
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
};

export type ButtonAppearance = {
  container?: StyleField<ButtonStyleFieldCallbackArgs>;
  button?: StyleField<ButtonStyleFieldCallbackArgs>;
  allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
  clearBtn?: StyleField<ButtonStyleFieldCallbackArgs>;
};

export type ButtonContent = {
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

export const generateUploadButton = <TRouter extends FileRouter>(
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
      config: UploadButtonProps<TRouter, TEndpoint, TSkipPolling>;
    }) => {
      const $props = props.config;

      const { mode = "auto", appendOnPaste = false } = $props.config ?? {};

      const fileInputRef = ref<HTMLInputElement | null>(null);
      const acRef = ref(new AbortController());

      const uploadProgress = ref(0);
      const files = ref<File[]>([]);

      const useUploadthingProps: UseUploadthingProps<
        TRouter,
        TEndpoint,
        TSkipPolling
      > = reactive({
        signal: acRef.value.signal,
        headers: $props.headers,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        skipPolling: !$props?.onClientUploadComplete
          ? true
          : ($props?.skipPolling as any),
        onClientUploadComplete: (res) => {
          if (fileInputRef.value) {
            fileInputRef.value.value = "";
          }
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

      const inputProps = computed(() => ({
        type: "file",
        ref: fileInputRef,
        multiple: permittedFileTypes.value.multiple,
        accept: generateMimeTypes(permittedFileTypes.value.fileTypes).join(
          ", ",
        ),
        disabled:
          $props.disabled ?? permittedFileTypes.value.fileTypes.length === 0,
        tabindex: permittedFileTypes.value.fileTypes.length === 0 ? -1 : 0,
        onChange: (e: Event) => {
          if (!e.target) return;
          const { files: selectedFiles } = e.target as HTMLInputElement;
          if (!selectedFiles) return;

          $props.onChange?.(Array.from(selectedFiles));

          if (mode === "manual") {
            files.value = Array.from(selectedFiles);
            return;
          }

          void uploadFiles(Array.from(selectedFiles));
        },
      }));

      const state = computed(() => {
        if (inputProps.value.disabled) return "disabled";
        if (!inputProps.value.disabled && !isUploading.value) return "ready";
        return "uploading";
      });

      usePaste((event) => {
        if (!appendOnPaste) return;
        if (document.activeElement !== fileInputRef.value) return;

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
          }) as ButtonStyleFieldCallbackArgs,
      );

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
            return `Choose File${inputProps.value.multiple ? `(s)` : ``}`;
          }
        }
      };

      const renderClearButton = () => (
        <button
          onClick={() => {
            files.value = [];

            if (fileInputRef.value) {
              fileInputRef.value.value = "";
            }
          }}
          class={twMerge(
            "h-[1.25rem] cursor-pointer rounded border-none bg-transparent text-gray-500 transition-colors hover:bg-slate-200 hover:text-gray-600",
            styleFieldToClassName(
              $props.appearance?.clearBtn,
              styleFieldArg.value,
            ),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.clearBtn,
            styleFieldArg.value,
          )}
          data-state={state}
          data-ut-element="clear-btn"
        >
          {contentFieldToContent(
            $props.content?.clearBtn,
            styleFieldArg.value,
          ) ?? "Clear"}
        </button>
      );

      const renderAllowedContent = () => (
        <div
          class={twMerge(
            "h-[1.25rem] text-xs leading-5 text-gray-600",
            styleFieldToClassName(
              $props.appearance?.allowedContent,
              styleFieldArg.value,
            ),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.allowedContent,
            styleFieldArg.value,
          )}
          data-state={state}
          data-ut-element="allowed-content"
        >
          {contentFieldToContent(
            $props.content?.allowedContent,
            styleFieldArg.value,
          ) ??
            allowedContentTextLabelGenerator(permittedFileInfo.value?.config)}
        </div>
      );

      const labelClass = computed(() =>
        twMerge(
          "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state.value === "disabled" && "cursor-not-allowed bg-blue-400",
          state.value === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${
              progressWidths[uploadProgress.value]
            }`,
          state.value === "ready" && "bg-blue-600",
          styleFieldToClassName($props.appearance?.button, styleFieldArg.value),
        ),
      );
      const containerClass = computed(() =>
        twMerge(
          "flex flex-col items-center justify-center gap-1",
          $props.class,
          styleFieldToClassName(
            $props.appearance?.container,
            styleFieldArg.value,
          ),
        ),
      );

      const containerStyle = computed(() =>
        styleFieldToCssObject(
          $props.appearance?.container,
          styleFieldArg.value,
        ),
      );
      const labelStyle = computed(() =>
        styleFieldToCssObject($props.appearance?.button, styleFieldArg.value),
      );

      return () => {
        return (
          <div
            class={containerClass.value}
            style={containerStyle.value ?? {}}
            data-state={state.value}
          >
            <label
              class={labelClass.value}
              style={labelStyle.value ?? {}}
              data-state={state.value}
              data-ut-element="button"
              onClick={async (e) => {
                if (state.value === "uploading") {
                  acRef.value.abort();
                  acRef.value = new AbortController();
                  return;
                }
                if (mode === "manual" && files.value.length > 0) {
                  e.preventDefault();
                  e.stopPropagation();
                  await uploadFiles(files.value);
                }
              }}
            >
              <input class="sr-only" {...inputProps.value} />
              {renderButton()}
            </label>
            {mode === "manual" && files.value.length > 0
              ? renderClearButton()
              : renderAllowedContent()}
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
