import { twMerge } from "tailwind-merge";
import { computed, defineComponent, reactive, ref } from "vue";

import {
  allowedContentTextLabelGenerator,
  ContentField,
  contentFieldToContent,
  generateMimeTypes,
  generatePermittedFileTypes,
  resolveMaybeUrlArg,
  StyleField,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/server";

import type {
  GenerateTypedHelpersOptions,
  UploadthingComponentProps,
  UseUploadthingProps,
} from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { progressWidths, Spinner } from "./shared";

type ButtonStyleFieldCallbackArgs = {
  __runtime: "vue";
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
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
  TSkipPolling extends boolean = false,
> = UploadthingComponentProps<TRouter, TEndpoint, TSkipPolling> & {
  /**
   * @see https://docs.uploadthing.com/theming#style-using-the-classname-prop
   */
  className?: string;
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
) =>
  defineComponent(
    <
      TEndpoint extends keyof TRouter,
      TSkipPolling extends boolean = false,
    >(props: {
      config: UploadButtonProps<TRouter, TEndpoint, TSkipPolling>;
    }) => {
      const $props = props.config;

      const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>({
        url: resolveMaybeUrlArg(props.config.url ?? initOpts?.url),
      });

      const fileInputRef = ref<HTMLInputElement | null>(null);
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
          if (fileInputRef.value) {
            fileInputRef.value.value = "";
          }
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

      const ready = computed(
        () => generatedPermittedFileTypes.value.fileTypes.length > 0,
      );

      const getUploadButtonText = (fileTypes: string[]) => {
        if (!(fileTypes.length > 0)) return "Loading...";
        return `Choose File${
          generatedPermittedFileTypes.value.multiple ? `(s)` : ``
        }`;
      };

      const uploadButtonText = computed(
        () =>
          contentFieldToContent($props.content?.button, styleFieldArg.value) ??
          (state.value === "uploading" ? (
            <Spinner />
          ) : (
            getUploadButtonText(generatedPermittedFileTypes.value.fileTypes)
          )),
      );

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

      const handleFileChange = (e: Event) => {
        if (!e.target) return;

        const { files: targetFiles } = e.target as HTMLInputElement;

        if (!targetFiles) return;

        const input = "input" in $props ? $props.input : undefined;
        const files = Array.from(targetFiles);
        void startUpload(files, input);
      };

      const state = computed(() => {
        if (!ready.value) return "readying";
        if (ready.value && !isUploading.value) return "ready";

        return "uploading";
      });

      const styleFieldArg = computed(
        () =>
          ({
            ready: ready.value,
            isUploading: isUploading.value,
            uploadProgress: uploadProgress.value,
            fileTypes: generatedPermittedFileTypes.value.fileTypes,
          }) as ButtonStyleFieldCallbackArgs,
      );

      const labelClass = computed(() =>
        twMerge(
          "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
          state.value === "readying" && "cursor-not-allowed bg-blue-400",
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
          $props.className,
          styleFieldToClassName(
            $props.appearance?.container,
            styleFieldArg.value,
          ),
        ),
      );
      const allowedContentClass = computed(() =>
        twMerge(
          "h-[1.25rem]  text-xs leading-5 text-gray-600",
          styleFieldToClassName(
            $props.appearance?.allowedContent,
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
      const allowedContentStyle = computed(() =>
        styleFieldToCssObject(
          $props.appearance?.allowedContent,
          styleFieldArg.value,
        ),
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
              tabindex={0}
            >
              <input
                class="hidden"
                type="file"
                ref={fileInputRef}
                multiple={generatedPermittedFileTypes.value.multiple}
                accept={generateMimeTypes(
                  generatedPermittedFileTypes.value.fileTypes,
                )?.join(", ")}
                onChange={handleFileChange}
                disabled={!ready}
              />
              {uploadButtonText.value}
            </label>
            <div
              class={allowedContentClass.value}
              style={allowedContentStyle.value ?? {}}
              data-state={state.value}
              data-ut-element="allowed-content"
            >
              {fileTypesText.value}
            </div>
          </div>
        );
      };
    },
    {
      props: ["config"] as any,
    },
  );
