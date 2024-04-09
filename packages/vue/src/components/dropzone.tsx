import { twMerge } from "tailwind-merge";
import { computed, defineComponent, reactive, ref, watch } from "vue";

import { useDropzone } from "@uploadthing/dropzone/vue";
import {
  allowedContentTextLabelGenerator,
  ContentField,
  contentFieldToContent,
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
  resolveMaybeUrlArg,
  StyleField,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/server";

import type { UploadthingComponentProps, UseUploadthingProps } from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { progressWidths, Spinner } from "./shared";

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
  TSkipPolling extends boolean = false,
> = UploadthingComponentProps<TRouter, TEndpoint, TSkipPolling> & {
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
};

export const UploadDropzone = <TRouter extends FileRouter>() =>
  defineComponent(
    <
      TEndpoint extends keyof TRouter,
      TSkipPolling extends boolean = false,
    >(props: {
      config: UploadDropzoneProps<TRouter, TEndpoint, TSkipPolling>;
    }) => {
      const $props = props.config;
      const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
        url: resolveMaybeUrlArg($props.url),
      });
      const files = ref<File[]>([]);

      const uploadProgress = ref(0);

      const useUploadthingProps: UseUploadthingProps<
        TRouter,
        TEndpoint,
        TSkipPolling
      > = reactive({
        headers: $props.headers,
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

      const generatedPermittedFileTypes = computed(() =>
        generatePermittedFileTypes(permittedFileInfo.value?.config),
      );
      const acceptedFileTypes = computed(() =>
        generateClientDropzoneAccept(
          generatedPermittedFileTypes.value.fileTypes,
        ),
      );

      const dropzoneOptions = reactive({
        onDrop: (acceptedFiles: File[]) => {
          files.value = acceptedFiles;

          // TODO: If mode is auto, start upload immediately
        },
        accept: acceptedFileTypes.value,
      });
      watch(
        () => acceptedFileTypes.value,
        (value) => {
          dropzoneOptions.accept = value;
        },
      );
      const { getRootProps, getInputProps, isDragActive } =
        useDropzone(dropzoneOptions);

      const fileTypesText = computed(() =>
        contentFieldToContent(
          $props.content?.allowedContent,
          styleFieldArg.value,
        ) ?? generatedPermittedFileTypes.value.fileTypes.length > 0
          ? allowedContentTextLabelGenerator(permittedFileInfo.value?.config)
          : // It contains whitespace because for some reason, if string is empty
            // There will be error on FE
            " ",
      );

      const ready = computed(
        () => generatedPermittedFileTypes.value.fileTypes.length > 0,
      );

      const styleFieldArg = computed(
        () =>
          ({
            fileTypes: generatedPermittedFileTypes.value.fileTypes,
            isDragActive: isDragActive.value,
            isUploading: isUploading.value,
            ready: ready.value,
            uploadProgress: uploadProgress.value,
          }) as DropzoneStyleFieldCallbackArgs,
      );

      const state = computed(() => {
        if (!ready.value) return "readying";
        if (ready.value && !isUploading.value) return "ready";

        return "uploading";
      });

      const uploadIconContent = computed(
        () =>
          contentFieldToContent(
            $props.content?.uploadIcon,
            styleFieldArg.value,
          ) ?? (
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
          ),
      );

      const containerClass = computed(() =>
        twMerge(
          "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
          isDragActive && "bg-blue-600/10",
          $props.className,
          styleFieldToClassName(
            $props.appearance?.container,
            styleFieldArg.value,
          ),
        ),
      );
      const labelClass = computed(() =>
        twMerge(
          "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
          ready.value ? "text-blue-600" : "text-gray-500",
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
          "relative mt-4 flex h-10 w-36 items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
          state.value === "uploading"
            ? `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${
                progressWidths[uploadProgress.value]
              }`
            : "bg-blue-600",
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

      const labelContent = computed(
        () =>
          contentFieldToContent($props.content?.label, styleFieldArg.value) ??
          (ready.value ? `Choose files or drag and drop` : `Loading...`),
      );
      const buttonContent = computed(
        () =>
          contentFieldToContent($props.content?.button, styleFieldArg.value) ??
          (isUploading.value ? (
            <Spinner />
          ) : (
            `Upload ${files.value.length} file${
              files.value.length === 1 ? "" : "s"
            }`
          )),
      );

      return () => {
        return (
          <div
            {...getRootProps()}
            class={containerClass.value}
            style={containerStyle.value}
            data-state={state.value}
          >
            {uploadIconContent.value}
            <label
              for="file-upload"
              class={labelClass.value}
              style={labelStyle.value}
              data-ut-element="label"
              data-state={state.value}
            >
              {labelContent.value}
              <input
                class="ut-sr-only"
                {...getInputProps()}
                // disabled={!ready.value}
              />
            </label>
            <div
              class={allowedContentClass.value}
              style={allowedContentStyle.value}
              data-ut-element="allowed-content"
              data-state={state.value}
            >
              {fileTypesText.value}
            </div>
            {files.value.length > 0 && (
              <button
                class={buttonClass.value}
                style={buttonStyle.value}
                data-ut-element="button"
                data-state={state.value}
                disabled={state.value === "uploading"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!files.value) return;

                  const input = "input" in $props ? $props.input : undefined;
                  void startUpload(files.value, input);
                }}
              >
                {buttonContent.value}
              </button>
            )}
          </div>
        );
      };
    },
    {
      props: ["config"] as any,
    },
  );
