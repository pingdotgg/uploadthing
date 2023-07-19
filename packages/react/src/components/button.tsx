import type { ErrorMessage, FileRouter } from "uploadthing/server";
import type { ContentField, SpinnerField, StyleField, UploadthingComponentProps } from "../types";
import { useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { generateMimeTypes, classNames } from "uploadthing/client";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { styleFieldToClassName, styleFieldToCssObject, spinnerFieldToElement, contentFieldToContent } from "../utils/styles";
import { Spinner } from "./shared";
import {
    allowedContentTextLabelGenerator,
    generatePermittedFileTypes,
    progressHeights
} from './shared'

type ButtonStyleFieldCallbackArgs = {
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
    fileTypes: string[];
};

export type UploadButtonProps<TRouter extends FileRouter> =
    UploadthingComponentProps<TRouter> & {
        appearance?: {
            container?: StyleField<ButtonStyleFieldCallbackArgs>;
            button?: StyleField<ButtonStyleFieldCallbackArgs>;
            buttonSpinner?: SpinnerField<ButtonStyleFieldCallbackArgs>;
            allowedContent?: StyleField<ButtonStyleFieldCallbackArgs>;
        };
        content?: {
            button?: ContentField<ButtonStyleFieldCallbackArgs>;
            allowedContent?: ContentField<ButtonStyleFieldCallbackArgs>;
        };
        className?: string;
    };

/**
 * @example
 * <UploadButton<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(res) => console.log(res)}
 *   onUploadError={(err) => console.log(err)}
 * />
 */
export function UploadButton<TRouter extends FileRouter>(
    props: FileRouter extends TRouter
        ? ErrorMessage<"You forgot to pass the generic">
        : UploadButtonProps<TRouter>,
) {
    // Cast back to UploadthingComponentProps<TRouter> to get the correct type
    // since the ErrorMessage messes it up otherwise
    const $props = props as UploadButtonProps<TRouter>;
    const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
        $props.endpoint,
        {
            onClientUploadComplete: (res) => {
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
                $props.onClientUploadComplete?.(res);
                setUploadProgress(0);
            },
            onUploadProgress: (p) => {
                setUploadProgress(p);
                $props.onUploadProgress?.(p);
            },
            onUploadError: $props.onUploadError,
        },
    );

    const { fileTypes, multiple } = generatePermittedFileTypes(
        permittedFileInfo?.config,
    );

    const ready = fileTypes.length > 0;

    const getUploadButtonText = (fileTypes: string[]) => {
        if (fileTypes.length === 0) return "Loading...";
        return `Choose File${multiple ? `(s)` : ``}`;
    };

    const getInputProps = () => ({
        className: "hidden",
        type: "file",
        ref: fileInputRef,
        multiple,
        accept: generateMimeTypes(fileTypes ?? [])?.join(", "),
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files) return;
            const input = "input" in $props ? $props.input : undefined;
            const files = Array.from(e.target.files);
            void startUpload(files, input);
        },
        disabled: !ready,
    })

    const styleFieldArg: ButtonStyleFieldCallbackArgs = {
        ready,
        isUploading,
        uploadProgress,
        fileTypes,
    };

    const getUtState = () => {
        if (!ready) return 'readying';
        if (ready && !isUploading) return 'ready';

        return 'uploading';
    }

    return (
        <div
            className={twMerge(
                "flex flex-col items-center justify-center gap-1",
                $props.className,
                styleFieldToClassName($props.appearance?.container, styleFieldArg),
            )}
            style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
            data-state={getUtState()}
        >
            <label
                className={twMerge(
                    classNames(
                        "relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500",
                        !ready && "cursor-not-allowed bg-blue-400",
                        ready &&
                        isUploading &&
                        `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressHeights[uploadProgress]}`,
                        ready && !isUploading && "bg-blue-600",
                    ),
                    styleFieldToClassName($props.appearance?.button, styleFieldArg),
                )}
                style={styleFieldToCssObject($props.appearance?.button, styleFieldArg)}
                data-state={getUtState()}
                data-ut-element="button"
            >
                <input
                    {...getInputProps()}
                />
                {isUploading
                    ? spinnerFieldToElement(
                        $props.appearance?.buttonSpinner,
                        styleFieldArg,
                    ) || <Spinner />
                    : contentFieldToContent($props.content?.button, styleFieldArg) ||
                    getUploadButtonText(fileTypes)}
            </label>
            <div
                className={twMerge(
                    "h-[1.25rem]  text-xs leading-5 text-gray-600",
                    styleFieldToClassName(
                        $props.appearance?.allowedContent,
                        styleFieldArg,
                    ),
                )}
                style={styleFieldToCssObject(
                    $props.appearance?.allowedContent,
                    styleFieldArg,
                )}
                data-state={getUtState()}
                data-ut-element="allowed-content"
            >
                {fileTypes &&
                    (
                        contentFieldToContent(
                            $props.content?.allowedContent,
                            styleFieldArg,
                        ) || allowedContentTextLabelGenerator(permittedFileInfo?.config)
                    )
                }
            </div>
        </div>
    );
}