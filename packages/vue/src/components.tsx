import type { FileRouter } from "uploadthing/server";
import { defineComponent, computed, ref } from "vue";
import type { UploadthingComponentProps } from "./types";

import { classNames, generateMimeTypes } from "uploadthing/client";

import {
    allowedContentTextLabelGenerator,
    generatePermittedFileTypes,
    progressHeights,
} from "./shared";
import { INTERNAL_uploadthingHookGen } from "./useUploadThing";

const Spinner = defineComponent(
    () => {
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
            )
        }
    }
);

export const UploadButton = <TRouter extends FileRouter>() => defineComponent(
    (props: {
        config: UploadthingComponentProps<TRouter>
    }) => {
        const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

        const fileInputRef = ref<HTMLInputElement | null>(null);
        const uploadProgress = ref(0);

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

        const generatedPermittedFileTypes = computed(
            () => generatePermittedFileTypes(
                permittedFileInfo.value?.config,
            )
        )

        const ready = computed(() => generatedPermittedFileTypes.value.fileTypes.length > 0)

        const getUploadButtonText = (fileTypes: string[]) => {
            if (!(fileTypes.length > 0)) return "Loading...";
            return `Choose File${generatedPermittedFileTypes.value.multiple ? `(s)` : ``}`;
        };

        const uploadButtonText = computed(
            () => isUploading.value ? <Spinner /> : getUploadButtonText(generatedPermittedFileTypes.value.fileTypes)
        )
        const fileTypesText = computed(
            () => generatedPermittedFileTypes.value.fileTypes ? <p class="ut-m-0 ut-text-xs ut-leading-5 ut-text-gray-600">
                {allowedContentTextLabelGenerator(permittedFileInfo.value?.config)}
            </p> : null
        )

        const handleFileChange = (e: Event) => {
            if (!e.target) return;

            const { files: targetFiles } = e.target as HTMLInputElement;

            if (!targetFiles) return;

            const input = "input" in $props ? $props.input : undefined;
            const files = Array.from(targetFiles);
            void startUpload(files, input);
        };

        const labelClass = computed(
            () => classNames(
                "ut-relative ut-flex ut-h-10 ut-w-36 ut-cursor-pointer ut-items-center ut-justify-center ut-overflow-hidden ut-rounded-md after:ut-transition-[width] after:ut-duration-500",
                !ready.value && "ut-cursor-not-allowed ut-bg-blue-400",
                ready.value &&
                isUploading.value &&
                `ut-bg-blue-400 after:ut-absolute after:ut-left-0 after:ut-h-full after:ut-bg-blue-600 ${progressHeights[uploadProgress.value]}`,
                ready.value && !isUploading.value && "ut-bg-blue-600",
            )
        )

        return () => {
            return (
                <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-1">
                    <label
                        class={labelClass.value}
                    >
                        <input
                            class="ut-hidden"
                            type="file"
                            ref={fileInputRef}
                            multiple={generatedPermittedFileTypes.value.multiple}
                            accept={generateMimeTypes(generatedPermittedFileTypes.value.fileTypes)?.join(', ')}
                            onChange={handleFileChange}
                            disabled={!ready}
                        />
                        <span class="ut-z-10 ut-px-3 ut-py-2 ut-text-white">
                            {uploadButtonText.value}
                        </span>
                    </label>
                    <div class="ut-h-[1.25rem]">
                        {fileTypesText.value}
                    </div>
                </div>
            );
        }
    },
    {
        props: ['config']
    }
)

// builder function to create generic component inside of SFC setup script
export const useUploadButton = <TRouter extends FileRouter>() => {
    return UploadButton<TRouter>();
}
