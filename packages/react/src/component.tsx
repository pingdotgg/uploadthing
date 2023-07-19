import type { CSSProperties } from "react";
import { useCallback, useRef, useState } from "react";
import type { FileWithPath, DropzoneState } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { twMerge } from "tailwind-merge";

import type {
  ExpandedRouteConfig,
  UploadThingError,
} from "@uploadthing/shared";
import type { UploadFileResponse } from "uploadthing/client";
import {
  classNames,
  generateClientDropzoneAccept,
  generateMimeTypes,
} from "uploadthing/client";
import type {
  ErrorMessage,
  FileRouter,
  inferEndpointInput,
  inferErrorShape,
} from "uploadthing/server";

import { INTERNAL_uploadthingHookGen } from "./useUploadThing";

const generatePermittedFileTypes = (config?: ExpandedRouteConfig) => {
  const fileTypes = config ? Object.keys(config) : [];

  const maxFileCount = config
    ? Object.values(config).map((v) => v.maxFileCount)
    : [];

  return { fileTypes, multiple: maxFileCount.some((v) => v && v > 1) };
};

const capitalizeStart = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const INTERNAL_doFormatting = (config?: ExpandedRouteConfig): string => {
  if (!config) return "";

  const allowedTypes = Object.keys(config) as (keyof ExpandedRouteConfig)[];

  const formattedTypes = allowedTypes.map((f) => {
    if (f.includes("/")) return `${f.split("/")[1].toUpperCase()} file`;
    return f === "blob" ? "file" : f;
  });

  // Format multi-type uploader label as "Supports videos, images and files";
  if (formattedTypes.length > 1) {
    const lastType = formattedTypes.pop();
    return `${formattedTypes.join("s, ")} and ${lastType}s`;
  }

  // Single type uploader label
  const key = allowedTypes[0];
  const formattedKey = formattedTypes[0];

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { maxFileSize, maxFileCount } = config[key]!;

  if (maxFileCount && maxFileCount > 1) {
    return `${formattedKey}s up to ${maxFileSize}, max ${maxFileCount}`;
  } else {
    return `${formattedKey} (${maxFileSize})`;
  }
};

const allowedContentTextLabelGenerator = (
  config?: ExpandedRouteConfig,
): string => {
  return capitalizeStart(INTERNAL_doFormatting(config));
};

export type UploadthingComponentProps<TRouter extends FileRouter> = {
  [TEndpoint in keyof TRouter]: {
    endpoint: TEndpoint;

    onUploadProgress?: (progress: number) => void;
    onClientUploadComplete?: (res?: UploadFileResponse[]) => void;
    onUploadError?: (error: UploadThingError<inferErrorShape<TRouter>>) => void;
  } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? {}
    : {
      input: inferEndpointInput<TRouter[TEndpoint]>;
    });
}[keyof TRouter];

type ButtonStyleFieldCallbackArgs = {
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
};

type DropzoneStyleFieldCallbackArgs = {
  ready: boolean;
  isUploading: boolean;
  uploadProgress: number;
  fileTypes: string[];
  isDragActive: boolean;
};

type StyleField<CallbackArg> =
  | string
  | CSSProperties
  | ((arg: CallbackArg) => string | CSSProperties);
type SpinnerField<CallbackArg> =
  | JSX.Element
  | ((arg: CallbackArg) => JSX.Element);
type ContentField<CallbackArg> =
  | string
  | JSX.Element
  | ((arg: CallbackArg) => string | JSX.Element);

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

export type UploadDropzoneProps<TRouter extends FileRouter> =
  UploadthingComponentProps<TRouter> & {
    appearance?: {
      container?: StyleField<DropzoneStyleFieldCallbackArgs>;
      dropzoneRoot?: StyleField<DropzoneStyleFieldCallbackArgs>;
      uploadIcon?: StyleField<DropzoneStyleFieldCallbackArgs>;
      label?: StyleField<DropzoneStyleFieldCallbackArgs>;
      allowedContentContainer?: StyleField<DropzoneStyleFieldCallbackArgs>;
      allowedContent?: StyleField<DropzoneStyleFieldCallbackArgs>;
      buttonContainer?: StyleField<DropzoneStyleFieldCallbackArgs>;
      button?: StyleField<DropzoneStyleFieldCallbackArgs>;
      buttonSpinner?: SpinnerField<DropzoneStyleFieldCallbackArgs>;
    };
    content?: {
      uploadIcon?: ContentField<DropzoneStyleFieldCallbackArgs>;
      label?: ContentField<DropzoneStyleFieldCallbackArgs>;
      allowedContent?: ContentField<DropzoneStyleFieldCallbackArgs>;
      button?: ContentField<DropzoneStyleFieldCallbackArgs>;
    };
  };

const styleFieldToClassName = <T,>(
  styleField: StyleField<T> | undefined,
  args: T,
) => {
  if (typeof styleField === "string") return styleField;
  if (typeof styleField === "function") {
    const result = styleField(args);

    if (typeof result === "string") return result;
  }

  return "";
};

const styleFieldToCssObject = <T,>(
  styleField: StyleField<T> | undefined,
  args: T,
) => {
  if (typeof styleField === "object") return styleField;
  if (typeof styleField === "function") {
    const result = styleField(args);

    if (typeof result === "object") return result;
  }

  return {};
};

const spinnerFieldToElement = <T,>(
  spinnerField: SpinnerField<T> | undefined,
  args: T,
) => {
  if (typeof spinnerField === "function") {
    const result = spinnerField(args);

    return result;
  }

  return spinnerField;
};

const contentFieldToContent = <T,>(
  contentField: ContentField<T> | undefined,
  arg: T,
) => {
  if (!contentField) return undefined;
  if (typeof contentField === "string") return contentField;
  if (typeof contentField !== "function") return contentField;
  if (typeof contentField === "function") {
    const result = contentField(arg);

    return result;
  }

  return undefined;
};

const progressHeights: { [key: number]: string } = {
  0: "after:w-0",
  10: "after:w-[10%]",
  20: "after:w-[20%]",
  30: "after:w-[30%]",
  40: "after:w-[40%]",
  50: "after:w-[50%]",
  60: "after:w-[60%]",
  70: "after:w-[70%]",
  80: "after:w-[80%]",
  90: "after:w-[90%]",
  100: "after:w-[100%]",
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
    if (!(fileTypes.length > 0)) return "Loading...";
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
      data-ut-state={getUtState()}
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
        data-ut-state={getUtState()}
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
        data-ut-state={getUtState()}
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

  return (
    <div
      className={twMerge(
        classNames(
          "mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10",
          isDragActive ? "bg-blue-600/10" : "",
        ),
        styleFieldToClassName($props.appearance?.container, styleFieldArg),
      )}
      style={styleFieldToCssObject($props.appearance?.container, styleFieldArg)}
    >
      <div
        className={twMerge(
          "text-center",
          styleFieldToClassName($props.appearance?.dropzoneRoot, styleFieldArg),
        )}
        {...getRootProps()}
        style={styleFieldToCssObject(
          $props.appearance?.dropzoneRoot,
          styleFieldArg,
        )}
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
        >
          {contentFieldToContent($props.content?.label, styleFieldArg) ||
            (ready ? `Choose files or drag and drop` : `Loading...`)}
          <input className="sr-only" {...getInputProps()} disabled={!ready} />
        </label>
        <div
          className={twMerge(
            "h-[1.25rem]",
            styleFieldToClassName(
              $props.appearance?.allowedContentContainer,
              styleFieldArg,
            ),
          )}
          style={styleFieldToCssObject(
            $props.appearance?.allowedContentContainer,
            styleFieldArg,
          )}
        >
          <p
            className={twMerge(
              "m-0 text-xs leading-5 text-gray-600",
              styleFieldToClassName(
                $props.appearance?.allowedContent,
                styleFieldArg,
              ),
            )}
          >
            {contentFieldToContent(
              $props.content?.allowedContent,
              styleFieldArg,
            ) || allowedContentTextLabelGenerator(permittedFileInfo?.config)}
          </p>
        </div>
        {files.length > 0 && (
          <div
            className={twMerge(
              "mt-4 flex items-center justify-center",
              styleFieldToClassName(
                $props.appearance?.buttonContainer,
                styleFieldArg,
              ),
            )}
            style={styleFieldToCssObject(
              $props.appearance?.buttonContainer,
              styleFieldArg,
            )}
          >
            <button
              className={twMerge(
                classNames(
                  "relative flex text-white h-10 w-36 items-center justify-center overflow-hidden rounded-md after:transition-[width] after:duration-500",
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
          </div>
        )}
      </div>
    </div>
  );
}

export function Uploader<TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter>,
) {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`Upload a file using a button:`}
        </span>
        {/* @ts-expect-error - this is validated above */}
        <UploadButton<TRouter> {...props} />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`...or using a dropzone:`}
        </span>
        {/* @ts-expect-error - this is validated above */}
        <UploadDropzone<TRouter> {...props} />
      </div>
    </>
  );
}

function Spinner() {
  return (
    <svg
      className="block h-5 w-5 animate-spin align-middle text-white"
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
}

export function generateComponents<TRouter extends FileRouter>() {
  return {
    UploadButton: UploadButton<TRouter>,
    UploadDropzone: UploadDropzone<TRouter>,
    Uploader: Uploader<TRouter>,
  };
}
