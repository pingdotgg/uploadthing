"use client";

import {
  contentFieldToContent,
  defaultClassListMerger,
  styleFieldToClassName,
  styleFieldToCssObject,
} from "@uploadthing/shared";
import type {
  ContentField,
  ErrorMessage,
  StyleField,
} from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/types";

import type { UploadthingComponentProps } from "../types";
import * as Primitive from "./primitive";
import { Cancel, progressWidths, Spinner } from "./shared";

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
> = UploadthingComponentProps<TRouter, TEndpoint> & {
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
  /**
   * Callback called when files are dropped or pasted.
   *
   * @param acceptedFiles - The files that were accepted.
   * @deprecated Use `onChange` instead
   */
  onDrop?: (acceptedFiles: File[]) => void;
};

/** These are some internal stuff we use to test the component and for forcing a state in docs */
type UploadThingInternalProps = {
  __internal_state?: "readying" | "ready" | "uploading";
  // Allow to set upload progress for testing
  __internal_upload_progress?: number;
  // Allow to set ready explicitly and independently of internal state
  __internal_ready?: boolean;
  // Allow to disable the button
  __internal_button_disabled?: boolean;
  // Allow to disable the dropzone
  __internal_dropzone_disabled?: boolean;
};

export function UploadDropzone<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadDropzoneProps<TRouter, TEndpoint>,
) {
  // Cast back to UploadthingComponentProps<TRouter> to get the correct type
  // since the ErrorMessage messes it up otherwise
  const {
    className,
    content,
    appearance,
    onDrop,
    __internal_dropzone_disabled,
    __internal_button_disabled,
    ...rootProps
  } = props as unknown as UploadDropzoneProps<TRouter, TEndpoint> &
    UploadThingInternalProps;

  const cn = rootProps.config?.cn ?? defaultClassListMerger;

  return (
    <Primitive.Root<TRouter, TEndpoint> {...(rootProps as any)}>
      <Primitive.Dropzone
        onFilesDropped={onDrop}
        disabled={__internal_dropzone_disabled}
      >
        {({
          files,
          fileTypes,
          dropzone,
          isUploading,
          ready,
          uploadProgress,
          state,
          options,
        }) => {
          const styleFieldArg = {
            fileTypes,
            isDragActive: !!dropzone?.isDragActive,
            isUploading,
            ready,
            uploadProgress,
          } as DropzoneStyleFieldCallbackArgs;

          const getUploadButtonContents = () => {
            const customContent = contentFieldToContent(
              content?.button,
              styleFieldArg,
            );
            if (customContent) return customContent;

            switch (state) {
              case "readying": {
                return "Loading...";
              }
              case "uploading": {
                if (uploadProgress === 100) return <Spinner />;
                return (
                  <span className="z-50">
                    <span className="block group-hover:hidden">
                      {uploadProgress}%
                    </span>
                    <Cancel
                      cn={cn}
                      className="hidden size-4 group-hover:block"
                    />
                  </span>
                );
              }
              case "disabled":
              case "ready":
              default: {
                if (options.mode === "manual" && files.length > 0) {
                  return `Upload ${files.length} file${files.length === 1 ? "" : "s"}`;
                }
                return `Choose File${options.multiple ? `(s)` : ``}`;
              }
            }
          };

          return (
            <div
              className={cn(
                "mt-2 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 text-center",
                dropzone?.isDragActive && "bg-blue-600/10",
                className,
                styleFieldToClassName(appearance?.container, styleFieldArg),
              )}
              style={styleFieldToCssObject(
                appearance?.container,
                styleFieldArg,
              )}
              data-state={state}
            >
              {contentFieldToContent(content?.uploadIcon, styleFieldArg) ?? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  className={cn(
                    "mx-auto block h-12 w-12 align-middle text-gray-400",
                    styleFieldToClassName(
                      appearance?.uploadIcon,
                      styleFieldArg,
                    ),
                  )}
                  style={styleFieldToCssObject(
                    appearance?.uploadIcon,
                    styleFieldArg,
                  )}
                  data-ut-element="upload-icon"
                  data-state={state}
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
                className={cn(
                  "relative mt-4 flex w-64 cursor-pointer items-center justify-center text-sm font-semibold leading-6 text-gray-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2 hover:text-blue-500",
                  ready ? "text-blue-600" : "text-gray-500",
                  styleFieldToClassName(appearance?.label, styleFieldArg),
                )}
                style={styleFieldToCssObject(appearance?.label, styleFieldArg)}
                data-ut-element="label"
                data-state={state}
              >
                {contentFieldToContent(content?.label, styleFieldArg) ??
                  (ready
                    ? `Choose ${options.multiple ? "file(s)" : "a file"} or drag and drop`
                    : `Loading...`)}
              </label>

              <Primitive.AllowedContent
                className={cn(
                  "m-0 h-[1.25rem] text-xs leading-5 text-gray-600",
                  styleFieldToClassName(
                    appearance?.allowedContent,
                    styleFieldArg,
                  ),
                )}
                style={styleFieldToCssObject(
                  appearance?.allowedContent,
                  styleFieldArg,
                )}
                data-ut-element="allowed-content"
              >
                {contentFieldToContent(content?.allowedContent, styleFieldArg)}
              </Primitive.AllowedContent>

              <Primitive.Button
                as="button"
                className={cn(
                  "group relative mt-4 flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md border-none text-base text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
                  state === "disabled" && "cursor-not-allowed bg-blue-400",
                  state === "readying" && "cursor-not-allowed bg-blue-400",
                  state === "uploading" &&
                    `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
                  state === "ready" && "bg-blue-600",
                  "disabled:pointer-events-none",
                  styleFieldToClassName(appearance?.button, styleFieldArg),
                )}
                style={styleFieldToCssObject(appearance?.button, styleFieldArg)}
                data-ut-element="button"
                disabled={__internal_button_disabled ?? !files.length}
              >
                {getUploadButtonContents()}
              </Primitive.Button>
            </div>
          );
        }}
      </Primitive.Dropzone>
    </Primitive.Root>
  );
}
