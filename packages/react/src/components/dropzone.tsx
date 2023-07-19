import { useState, useCallback } from "react";
import type { FileWithPath } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { twMerge } from "tailwind-merge";
import { generateClientDropzoneAccept, classNames } from "uploadthing/client";
import type { FileRouter, ErrorMessage } from "uploadthing/server";
import type { StyleField, SpinnerField, ContentField, UploadthingComponentProps } from "../types";
import { INTERNAL_uploadthingHookGen } from "../useUploadThing";
import { styleFieldToClassName, styleFieldToCssObject, contentFieldToContent, spinnerFieldToElement } from "../utils/styles";
import { generatePermittedFileTypes, allowedContentTextLabelGenerator, progressHeights, Spinner } from "./shared";

type DropzoneStyleFieldCallbackArgs = {
    ready: boolean;
    isUploading: boolean;
    uploadProgress: number;
    fileTypes: string[];
    isDragActive: boolean;
};

export type UploadDropzoneProps<TRouter extends FileRouter> =
    UploadthingComponentProps<TRouter> & {
        appearance?: {
            container?: StyleField<DropzoneStyleFieldCallbackArgs>;
            uploadIcon?: StyleField<DropzoneStyleFieldCallbackArgs>;
            label?: StyleField<DropzoneStyleFieldCallbackArgs>;
            allowedContent?: StyleField<DropzoneStyleFieldCallbackArgs>;
            button?: StyleField<DropzoneStyleFieldCallbackArgs>;
            buttonSpinner?: SpinnerField<DropzoneStyleFieldCallbackArgs>;
        };
        content?: {
            uploadIcon?: ContentField<DropzoneStyleFieldCallbackArgs>;
            label?: ContentField<DropzoneStyleFieldCallbackArgs>;
            allowedContent?: ContentField<DropzoneStyleFieldCallbackArgs>;
            button?: ContentField<DropzoneStyleFieldCallbackArgs>;
        };
        className?: string;
    };

export function UploadDropzone<TRouter extends FileRouter>(
    props: FileRouter extends TRouter
        ? ErrorMessage<"You forgot to pass the generic">
        : UploadDropzoneProps<TRouter>,
) {
    // Cast back to UploadthingComponentProps<TRouter> to get the correct type
    // since the ErrorMessage messes it up otherwise
    const $props = props as UploadDropzoneProps<TRouter>;
    const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

    const [files, setFiles] = useState<File[]>([]);
    const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
        setFiles(acceptedFiles);
    }, []);

    const [uploadProgress, setUploadProgress] = useState(0);
    const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
        $props.endpoint,
        {
            onClientUploadComplete: (res) => {
                setFiles([]);
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

    const { fileTypes } = generatePermittedFileTypes(permittedFileInfo?.config);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
    });

    const ready = fileTypes.length > 0;

    const styleFieldArg: DropzoneStyleFieldCallbackArgs = {
        fileTypes,
        isDragActive,
        isUploading,
        ready,
        uploadProgress,
    };
    const onUploadClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!files) return;

        const input = "input" in $props ? $props.input : undefined;
        void startUpload(files, input);
    }
    const getUtState = () => {
        if (!ready) return 'readying';
        if (ready && !isUploading) return 'ready';

        return 'uploading';
    }

    return (
        <div
            className={twMerge(
                "text-center mt-2 flex flex-col justify-center items-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10",
                isDragActive ? "bg-blue-600/10" : "",
                $props.className,
                styleFieldToClassName($props.appearance?.container, styleFieldArg),
            )}
            {...getRootProps()}
            style={styleFieldToCssObject(
                $props.appearance?.container,
                styleFieldArg,
            )}
            data-state={getUtState()}
        >
            {contentFieldToContent($props.content?.uploadIcon, styleFieldArg) || (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    className={twMerge(
                        "mx-auto block h-12 w-12 align-middle text-gray-400",
                        styleFieldToClassName(
                            $props.appearance?.uploadIcon,
                            styleFieldArg,
                        ),
                    )}
                    style={styleFieldToCssObject(
                        $props.appearance?.uploadIcon,
                        styleFieldArg,
                    )}
                    data-ut-element="upload-icon"
                    data-state={getUtState()}
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
                htmlFor="file-upload"
                className={twMerge(
                    classNames(
                        "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
                        ready ? "text-blue-600" : "text-gray-500",
                    ),
                    styleFieldToClassName($props.appearance?.label, styleFieldArg),
                )}
                style={styleFieldToCssObject($props.appearance?.label, styleFieldArg)}
                data-ut-element="label"
                data-state={getUtState()}
            >
                {contentFieldToContent($props.content?.label, styleFieldArg) ||
                    (ready ? `Choose files or drag and drop` : `Loading...`)}
                <input className="sr-only" {...getInputProps()} disabled={!ready} />
            </label>
            <div
                className={twMerge(
                    "h-[1.25rem] m-0 text-xs leading-5 text-gray-600",
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
                data-state={getUtState()}
            >
                {
                    contentFieldToContent(
                        $props.content?.allowedContent,
                        styleFieldArg,
                    ) || allowedContentTextLabelGenerator(permittedFileInfo?.config)
                }
            </div>
            {files.length > 0 && (
                <button
                    className={twMerge(
                        classNames(
                            "relative flex mt-4 text-white h-10 w-36 items-center justify-center overflow-hidden rounded-md after:transition-[width] after:duration-500",
                            isUploading
                                ? `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 ${progressHeights[uploadProgress]}`
                                : "bg-blue-600",
                        ),
                        styleFieldToClassName($props.appearance?.button, styleFieldArg),
                    )}
                    style={styleFieldToCssObject(
                        $props.appearance?.button,
                        styleFieldArg,
                    )}
                    onClick={onUploadClick}
                    data-ut-element="button"
                    data-state={getUtState()}
                    disabled={isUploading}
                >
                    {isUploading
                        ? spinnerFieldToElement(
                            $props.appearance?.buttonSpinner,
                            styleFieldArg,
                        ) || <Spinner />
                        : contentFieldToContent(
                            $props.content?.button,
                            styleFieldArg,
                        ) ||
                        `Upload ${files.length} file${files.length === 1 ? "" : "s"
                        }`}
                </button>
            )}
        </div>
    );
}