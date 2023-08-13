import { computed, defineComponent, reactive, ref, watch } from "vue";

import { useDropzone, type FileUploadOptions } from "./useDropzone";
import { classNames, generateMimeTypes } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";

import {
  allowedContentTextLabelGenerator,
  generatePermittedFileTypes,
  progressHeights,
} from "./shared";
import type { UploadthingComponentProps } from "./types";
import { INTERNAL_uploadthingHookGen } from "./useUploadThing";

const Spinner = defineComponent(() => {
  return () => {
    return (
      <svg
        class="ut-block ut-h-5 ut-w-5 ut-animate-spin ut-align-middle ut-text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 576 512"
      >
        <path
          fill="currentColor"
          d="M256 32C256 14.33 270.3 0 288 0C429.4 0 544 114.6 544 256C544 302.6 531.5 346.4 509.7 384C500.9 399.3 481.3 404.6 465.1 395.7C450.7 386.9 445.5 367.3 454.3 351.1C470.6 323.8 480 291 480 255.1C480 149.1 394 63.1 288 63.1C270.3 63.1 256 49.67 256 31.1V32z"
        />
      </svg>
    );
  };
});

export const UploadButton = <TRouter extends FileRouter>() =>
  defineComponent(
    (props: { config: UploadthingComponentProps<TRouter> }) => {
      const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

      const fileInputRef = ref<HTMLInputElement | null>(null);
      const uploadProgress = ref(0);

      watch(
        () => uploadProgress.value,
        (value) => {
          console.log("uploadProgress", value);
        },
      );

      const $props = props.config;

      const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
        $props.endpoint,
        {
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
        },
      );

      const generatedPermittedFileTypes = computed(() =>
        generatePermittedFileTypes(permittedFileInfo.value?.config),
      );

      const ready = computed(
        () => generatedPermittedFileTypes.value.fileTypes.length > 0,
      );

      const getUploadButtonText = (fileTypes: string[]) => {
        if (!(fileTypes.length > 0)) return "Loading...";
        return `Choose File${generatedPermittedFileTypes.value.multiple ? `(s)` : ``
          }`;
      };

      const uploadButtonText = computed(() =>
        isUploading.value ? (
          <Spinner />
        ) : (
          getUploadButtonText(generatedPermittedFileTypes.value.fileTypes)
        ),
      );
      const fileTypesText = computed(() =>
        generatedPermittedFileTypes.value.fileTypes ? (
          <p class="ut-m-0 ut-text-xs ut-leading-5 ut-text-gray-600">
            {allowedContentTextLabelGenerator(permittedFileInfo.value?.config)}
          </p>
        ) : null,
      );

      const handleFileChange = (e: Event) => {
        if (!e.target) return;

        const { files: targetFiles } = e.target as HTMLInputElement;

        if (!targetFiles) return;

        const input = "input" in $props ? $props.input : undefined;
        const files = Array.from(targetFiles);
        void startUpload(files, input);
      };

      const labelClass = computed(() =>
        classNames(
          "ut-relative ut-flex ut-h-10 ut-w-36 ut-cursor-pointer ut-items-center ut-justify-center ut-overflow-hidden ut-rounded-md after:ut-transition-[width] after:ut-duration-500",
          !ready.value && "ut-cursor-not-allowed ut-bg-blue-400",
          ready.value &&
          isUploading.value &&
          `ut-bg-blue-400 after:ut-content-[''] after:ut-block after:ut-absolute after:ut-left-0 after:ut-h-full after:ut-bg-blue-600 ${progressHeights[uploadProgress.value]
          }`,
          ready.value && !isUploading.value && "ut-bg-blue-600",
        ),
      );

      return () => {
        return (
          <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-1">
            <label class={labelClass.value}>
              <input
                class="ut-hidden"
                type="file"
                ref={fileInputRef}
                multiple={generatedPermittedFileTypes.value.multiple}
                accept={generateMimeTypes(
                  generatedPermittedFileTypes.value.fileTypes,
                )?.join(", ")}
                onChange={handleFileChange}
                disabled={!ready}
              />
              <span class="ut-z-10 ut-px-3 ut-py-2 ut-text-white">
                {uploadButtonText.value}
              </span>
            </label>
            <div class="ut-h-[1.25rem]">{fileTypesText.value}</div>
          </div>
        );
      };
    },
    {
      props: ["config"],
    },
  );

export const UploadDropzone = <TRouter extends FileRouter>() =>
  defineComponent(
    (props: { config: UploadthingComponentProps<TRouter> }) => {
      const $props = props.config;
      const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
      const files = ref<File[]>([]);

      const uploadProgress = ref(0);

      const setFiles = (newFiles: File[]) => {
        files.value = newFiles;
      };

      const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
        $props.endpoint,
        {
          onClientUploadComplete: (res) => {
            setFiles([]);
            $props.onClientUploadComplete?.(res);
            uploadProgress.value = 0;
          },
          onUploadProgress: (p) => {
            uploadProgress.value = p;
            $props.onUploadProgress?.(p);
          },
          onUploadError: $props.onUploadError,
        },
      );

      const generatedPermittedFileTypes = computed(() =>
        generatePermittedFileTypes(permittedFileInfo.value?.config),
      );
      const acceptedFileTypes = computed(() =>
        generatedPermittedFileTypes.value.fileTypes.map((fileType) => {
          const map: Record<string, string> = {
            image: "image/*",
            video: "video/*",
            audio: "audio/*",
            text: "text/*",
          };

          return map[fileType] || fileType;
        }),
      );

      const ready = computed(
        () => generatedPermittedFileTypes.value.fileTypes.length > 0,
      );

      const dropzoneOptions = reactive<Partial<FileUploadOptions>>({
        onDrop: (acceptedFiles) => {
          console.log(acceptedFiles);

          setFiles(acceptedFiles);
        },
        accept: acceptedFileTypes.value,
      });

      watch(
        () => acceptedFileTypes.value,
        (value) => {
          dropzoneOptions.accept = value;
        },
      );

      const { getRootProps, getInputProps, isDragActive } = useDropzone(dropzoneOptions);

      return () => {
        return (
          <div
            class={classNames(
              "ut-mt-2 ut-flex ut-justify-center ut-rounded-lg ut-border ut-border-dashed ut-border-gray-900/25 ut-px-6 ut-py-10",
              isDragActive.value ? "ut-bg-blue-600/10" : "",
            )}
          >
            <div class="ut-text-center" {...getRootProps()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                class="ut-mx-auto ut-block ut-h-12 ut-w-12 ut-align-middle ut-text-gray-400"
              >
                <path
                  fill="currentColor"
                  fill-rule="evenodd"
                  d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <div class="ut-mt-4 ut-flex ut-text-sm ut-leading-6 ut-text-gray-600">
                <label
                  for="file-upload"
                  class={classNames(
                    "ut-relative ut-cursor-pointer ut-font-semibold  focus-within:ut-outline-none focus-within:ut-ring-2 focus-within:ut-ring-blue-600 focus-within:ut-ring-offset-2 hover:ut-text-blue-500",
                    ready.value ? "ut-text-blue-600" : "ut-text-gray-500",
                  )}
                >
                  <span class="ut-flex ut-w-64 ut-items-center ut-justify-center">
                    {ready.value
                      ? `Choose files or drag and drop`
                      : `Loading...`}
                  </span>
                  <input
                    class="ut-sr-only"
                    {...getInputProps()}
                    disabled={!ready.value}
                  />
                </label>
              </div>
              <div class="ut-h-[1.25rem]">
                <p class="ut-m-0 ut-text-xs ut-leading-5 ut-text-gray-600">
                  {allowedContentTextLabelGenerator(
                    permittedFileInfo.value?.config,
                  )}
                </p>
              </div>
              {files.value.length > 0 && (
                <div class="ut-mt-4 ut-flex ut-items-center ut-justify-center">
                  <button
                    class={classNames(
                      "ut-relative ut-flex ut-cursor-pointer ut-h-10 ut-w-36 ut-items-center ut-justify-center ut-overflow-hidden ut-rounded-md after:ut-transition-[width] after:ut-duration-500 ut-border-none",
                      isUploading.value
                        ? `ut-bg-blue-400 after:ut-content-[''] after:ut-block after:ut-absolute after:ut-left-0 after:ut-h-full after:ut-bg-blue-600 ${progressHeights[uploadProgress.value]
                        }`
                        : "ut-bg-blue-600",
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!files.value) return;

                      const input =
                        "input" in $props ? $props.input : undefined;
                      void startUpload(files.value, input);
                    }}
                  >
                    <span class="ut-z-10 ut-px-3 ut-py-2 ut-text-white">
                      {isUploading.value ? (
                        <Spinner />
                      ) : (
                        `Upload ${files.value.length} file${files.value.length === 1 ? "" : "s"
                        }`
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      };
    },
    {
      props: ["config"],
    },
  );

// builder function to create generic component inside of SFC setup script
export const useUploadButton = <TRouter extends FileRouter>() => {
  return UploadButton<TRouter>();
};

export const useUploadDropzone = <TRouter extends FileRouter>() => {
  return UploadDropzone<TRouter>();
};
