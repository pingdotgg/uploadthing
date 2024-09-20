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

type ButtonStyleFieldCallbackArgs = {
  __runtime: "react";
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
> = UploadthingComponentProps<TRouter, TEndpoint> & {
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

/**
 * @remarks It is not recommended using this directly as it requires manually binding generics. Instead, use `createUploadButton`.
 * @example
 * <UploadButton<OurFileRouter, "someEndpoint">
 *   endpoint="someEndpoint"
 *   onUploadComplete={(res) => console.log(res)}
 *   onUploadError={(err) => console.log(err)}
 * />
 */
export function UploadButton<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadButtonProps<TRouter, TEndpoint>,
) {
  // Cast back to UploadthingComponentProps<TRouter> to get the correct type
  // since the ErrorMessage messes it up otherwise
  const { className, content, appearance, ...$props } =
    props as unknown as UploadButtonProps<TRouter, TEndpoint>;

  const cn = defaultClassListMerger ?? $props.config ?? {};

  return (
    <Primitive.Root<TRouter, TEndpoint> {...($props as any)}>
      {({ state, uploadProgress, fileTypes, files, options }) => {
        const styleFieldArg = {
          ready: state !== "readying",
          isUploading: state === "uploading",
          uploadProgress: uploadProgress,
          fileTypes: fileTypes,
        } as ButtonStyleFieldCallbackArgs;

        const renderAllowedContent = () => (
          <div
            className={cn(
              "h-[1.25rem] text-xs leading-5 text-gray-600",
              styleFieldToClassName(appearance?.allowedContent, styleFieldArg),
            )}
            style={styleFieldToCssObject(
              appearance?.allowedContent,
              styleFieldArg,
            )}
            data-state={state}
            data-ut-element="allowed-content"
          >
            <Primitive.AllowedContent>
              {contentFieldToContent(content?.allowedContent, styleFieldArg)}
            </Primitive.AllowedContent>
          </div>
        );

        const renderClearButton = () => (
          <Primitive.ClearButton
            className={cn(
              "h-[1.25rem] cursor-pointer rounded border-none bg-transparent text-gray-500 transition-colors hover:bg-slate-200 hover:text-gray-600",
              styleFieldToClassName(appearance?.clearBtn, styleFieldArg),
            )}
            style={styleFieldToCssObject(appearance?.clearBtn, styleFieldArg)}
            data-state={state}
            data-ut-element="clear-btn"
          >
            {contentFieldToContent(content?.clearBtn, styleFieldArg)}
          </Primitive.ClearButton>
        );

        const renderButton = () => {
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
                  <Cancel cn={cn} className="hidden size-4 group-hover:block" />
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
              "flex flex-col items-center justify-center gap-1",
              className,
              styleFieldToClassName(appearance?.container, styleFieldArg),
            )}
            style={styleFieldToCssObject(appearance?.container, styleFieldArg)}
            data-state={state}
          >
            <Primitive.Button
              className={cn(
                "group relative flex h-10 w-36 cursor-pointer items-center justify-center overflow-hidden rounded-md text-white after:transition-[width] after:duration-500 focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2",
                state === "disabled" && "cursor-not-allowed bg-blue-400",
                state === "readying" && "cursor-not-allowed bg-blue-400",
                state === "uploading" &&
                  `bg-blue-400 after:absolute after:left-0 after:h-full after:bg-blue-600 after:content-[''] ${progressWidths[uploadProgress]}`,
                state === "ready" && "bg-blue-600",
                styleFieldToClassName(appearance?.button, styleFieldArg),
              )}
              style={styleFieldToCssObject(appearance?.button, styleFieldArg)}
              data-state={state}
              data-ut-element="button"
            >
              {renderButton()}
            </Primitive.Button>
            {options.mode === "manual" && files.length > 0
              ? renderClearButton()
              : renderAllowedContent()}
          </div>
        );
      }}
    </Primitive.Root>
  );
}
