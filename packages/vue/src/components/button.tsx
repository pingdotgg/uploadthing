import * as Vue from "vue";
import { computed, reactive, ref } from "vue";

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
import type { ContentField, StyleField } from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/server";

import type {
  GenerateTypedHelpersOptions,
  UploadthingComponentProps,
  UseUploadthingProps,
} from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { Cancel, progressWidths, Spinner, usePaste } from "./shared";

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

export const generateUploadButton = <TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) => {
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
    url: resolveMaybeUrlArg(initOpts?.url),
  });

  return Vue.defineComponent(
    <TEndpoint extends keyof TRouter>(props: {
      config: UploadButtonProps<TRouter, TEndpoint>;
    }) => {
      const $props = props.config;

      const {
        mode = "auto",
        appendOnPaste = false,
        cn = defaultClassListMerger,
      } = $props.config ?? {};
      const acRef = ref(new AbortController());

      const fileInputRef = ref<HTMLInputElement | null>(null);
      const labelRef = ref<HTMLLabelElement | null>(null);
      const uploadProgress = ref(0);
      const files = ref<File[]>([]);

      const useUploadthingProps: UseUploadthingProps<TRouter, TEndpoint> =
        reactive({
          signal: acRef.value.signal,
          headers: $props.headers,
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

      const { startUpload, isUploading, routeConfig } = useUploadThing(
        $props.endpoint,
        useUploadthingProps,
      );

      const uploadFiles = (files: File[]) => {
        const input = "input" in $props ? $props.input : undefined;
        startUpload(files, input).catch((e) => {
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
          if (uploadProgress.value >= 100) return <Spinner />;
          return (
            <span class="z-50">
              <span class="block group-hover:hidden">
                {uploadProgress.value}%
              </span>
              <Cancel cn={cn} class="hidden size-4 group-hover:block" />
            </span>
          );
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

            $props.onChange?.([]);
          }}
          class={cn(
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
          data-state={state.value}
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
          class={cn(
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
          ) ?? allowedContentTextLabelGenerator(routeConfig.value)}
        </div>
      );

      const labelClass = computed(() =>
        cn(
          "group relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state.value === "disabled" && "cursor-not-allowed bg-blue-400",
          state.value === "uploading" &&
            `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress.value]}`,
          state.value === "ready" && "bg-blue-600",
          styleFieldToClassName($props.appearance?.button, styleFieldArg.value),
        ),
      );
      const containerClass = computed(() =>
        cn(
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
              onClick={(e) => {
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

                  uploadFiles(files.value);
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
