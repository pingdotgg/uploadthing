import type { CSSProperties } from "react";
import { useCallback, useRef, useState } from "react";
import type { FileWithPath } from "react-dropzone";
import { useDropzone } from "react-dropzone";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import {
  classNames,
  generateClientDropzoneAccept,
  generateMimeTypes,
} from "uploadthing/client";
import type { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";

import { useUploadThing } from "./useUploadThing";

type EndpointHelper<TRouter extends void | FileRouter> = void extends TRouter
  ? "YOU FORGOT TO PASS THE GENERIC"
  : keyof TRouter;

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

/**
 * @example
 * <UploadButton<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(res) => console.log(res)}
 *   onUploadError={(err) => console.log(err)}
 * />
 */
export function UploadButton<TRouter extends void | FileRouter = void>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadError?: (error: Error) => void;
  appearance?: {
    container?: {
      classes?: {
        display?: string;
        flexDirection?: string;
        gap?: string;
        alignItems?: string;
        justifyContent?: string;
        className?: string;
      };
      inlineStyle?: CSSProperties;
    };
    button?: {
      default?: {
        className?: string;
        rounded?: string;
        width?: string;
        height?: string;
        display?: string;
        alignItems?: string;
        justifyContent?: string;
        cursor?: string;
      };
      ready?: {
        className?: string;
        bg?: string;
      };
      notReady?: {
        className?: string;
        opacity?: string;
        bg?: string;
        cursor?: string;
      };
      inlineStyle?: CSSProperties | ((ready: boolean) => CSSProperties | undefined);
    };
    loader?: JSX.Element;
    buttonContent?: {
      classes?: {
        className?: string;
        px?: string;
        py?: string;
        textColor?: string;
      };
      inlineStyle?: CSSProperties;
    };
    fileTypes?: {
      container?: {
        classes?: {
          className?: string;
          height?: string;
        };
        inlineStyle?: CSSProperties;
      };
      items?: {
        classes?: {
          className?: string;
          textSize?: string;
          lineHeight?: string;
          textColor?: string;
        };
        inlineStyle?: CSSProperties;
      };
    }
  }
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload, isUploading, permittedFileInfo } =
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: (res) => {
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (props.onClientUploadComplete) {
          props.onClientUploadComplete(res);
        }
      },
      onUploadError: props.onUploadError,
    });

  const { fileTypes, multiple } = generatePermittedFileTypes(
    permittedFileInfo?.config,
  );

  const ready = fileTypes.length > 0;

  const getUploadButtonText = (fileTypes: string[]) => {
    if (!(fileTypes.length > 0)) return "Loading...";
    return `Choose File${multiple ? `(s)` : ``}`;
  };

  return (
    <div
      className={classNames(
        props.appearance?.container?.classes?.display || "ut-flex",
        props.appearance?.container?.classes?.flexDirection || "ut-flex-col",
        props.appearance?.container?.classes?.gap || "ut-gap-1",
        props.appearance?.container?.classes?.alignItems || "ut-items-center",
        props.appearance?.container?.classes?.justifyContent || "ut-justify-center",
        props.appearance?.container?.classes?.className || "",
      )}
      style={props.appearance?.container?.inlineStyle}
    >
      <label
        className={classNames(
          classNames(
            props.appearance?.button?.default?.rounded || "ut-rounded-md",
            props.appearance?.button?.default?.width || "ut-w-36",
            props.appearance?.button?.default?.height || "ut-h-10",
            props.appearance?.button?.default?.display || "ut-flex",
            props.appearance?.button?.default?.alignItems || "ut-items-center",
            props.appearance?.button?.default?.justifyContent || "ut-justify-center",
            props.appearance?.button?.default?.cursor || "ut-cursor-pointer",
            props.appearance?.button?.default?.className || "",
          ),
          !ready
            ? classNames(
              props.appearance?.button?.notReady?.opacity || "ut-opacity-50",
              props.appearance?.button?.notReady?.bg || "ut-bg-gray-600",
              props.appearance?.button?.notReady?.cursor || "ut-cursor-not-allowed",
              props.appearance?.button?.notReady?.className || ""
            )
            : classNames(
              props.appearance?.button?.ready?.bg || "ut-bg-blue-600",
              props.appearance?.button?.ready?.className || ""
            ),
        )}
        style={
          typeof props.appearance?.button?.inlineStyle === "function"
            ? props.appearance?.button?.inlineStyle(ready)
            : props.appearance?.button?.inlineStyle
        }
      >
        <input
          className="ut-hidden"
          type="file"
          ref={fileInputRef}
          multiple={multiple}
          accept={generateMimeTypes(fileTypes ?? [])?.join(", ")}
          onChange={(e) => {
            if (!e.target.files) return;
            void startUpload(Array.from(e.target.files));
          }}
          disabled={!ready}
        />
        <span
          className={
            classNames(
              props.appearance?.buttonContent?.classes?.px || "ut-px-3",
              props.appearance?.buttonContent?.classes?.py || "ut-py-2",
              props.appearance?.buttonContent?.classes?.textColor || "ut-text-white",
              props.appearance?.buttonContent?.classes?.className || ""
            )
          }
          style={props.appearance?.buttonContent?.inlineStyle}
        >
          {
            isUploading
              ? (props.appearance?.loader || <Spinner />)
              : getUploadButtonText(fileTypes)
          }
        </span>
      </label>
      <div
        className={
          classNames(
            props.appearance?.fileTypes?.container?.classes?.height || "ut-h-[1.25rem]",
            props.appearance?.fileTypes?.container?.classes?.className || ""
          )
        }
        style={props.appearance?.fileTypes?.container?.inlineStyle}
      >
        {fileTypes && (
          <p
            className={
              classNames(
                props.appearance?.fileTypes?.items?.classes?.textSize || "ut-text-xs",
                props.appearance?.fileTypes?.items?.classes?.lineHeight || "ut-leading-5",
                props.appearance?.fileTypes?.items?.classes?.textColor || "ut-text-gray-600",
                props.appearance?.fileTypes?.items?.classes?.className || ""
              )
            }
            style={props.appearance?.fileTypes?.items?.inlineStyle}
          >
            {allowedContentTextLabelGenerator(permittedFileInfo?.config)}
          </p>
        )}
      </div>
    </div>
  );
}

const Spinner = () => {
  return (
    <svg
      className="ut-animate-spin ut-h-5 ut-w-5 ut-text-white"
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

export const UploadDropzone = <
  TRouter extends void | FileRouter = void,
>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadError?: (error: Error) => void;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { startUpload, isUploading, permittedFileInfo } =
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: (res) => {
        setFiles([]);
        if (props.onClientUploadComplete) {
          props.onClientUploadComplete(res);
        }
      },
      onUploadError: props.onUploadError,
    });

  const { fileTypes } = generatePermittedFileTypes(permittedFileInfo?.config);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
  });

  const ready = fileTypes.length > 0;

  return (
    <div
      className={classNames(
        "ut-mt-2 ut-flex ut-justify-center ut-rounded-lg ut-border ut-border-dashed ut-border-gray-900/25 ut-px-6 ut-py-10",
        isDragActive ? "ut-bg-blue-600/10" : "",
      )}
    >
      <div className="text-center" {...getRootProps()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className="ut-mx-auto ut-h-12 ut-w-12 ut-text-gray-400"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
            clipRule="evenodd"
          ></path>
        </svg>
        <div className="ut-mt-4 ut-flex ut-text-sm ut-leading-6 ut-text-gray-600">
          <label
            htmlFor="file-upload"
            className={classNames(
              "ut-relative ut-cursor-pointer ut-font-semibold  focus-within:ut-outline-none focus-within:ut-ring-2 focus-within:ut-ring-blue-600 focus-within:ut-ring-offset-2 hover:ut-text-blue-500",
              ready ? "ut-text-blue-600" : "ut-text-gray-500",
            )}
          >
            <span className="ut-w-64 ut-flex ut-items-center ut-justify-center">
              {ready ? `Choose files or drag and drop` : `Loading...`}
            </span>
            <input
              className="ut-sr-only"
              {...getInputProps()}
              disabled={!ready}
            />
          </label>
        </div>
        <div className="ut-h-[1.25rem]">
          <p className="ut-text-xs ut-leading-5 ut-text-gray-600">
            {allowedContentTextLabelGenerator(permittedFileInfo?.config)}
          </p>
        </div>
        {files.length > 0 && (
          <div className="ut-mt-4 ut-flex ut-items-center ut-justify-center">
            <button
              className="ut-bg-blue-600 ut-rounded-md ut-w-36 ut-h-10 ut-flex ut-items-center ut-justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!files) return;

                void startUpload(files);
              }}
            >
              <span className="ut-px-3 ut-py-2 ut-text-white">
                {isUploading ? (
                  <Spinner />
                ) : (
                  `Upload ${files.length} file${files.length === 1 ? "" : "s"}`
                )}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Uploader = <TRouter extends void | FileRouter = void>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: () => void;
  url?: string;
}) => {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`Upload a file using a button:`}
        </span>
        <UploadButton<TRouter> {...props} />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`...or using a dropzone:`}
        </span>
        <UploadDropzone<TRouter> {...props} />
      </div>
    </>
  );
};

export function generateComponents<TRouter extends FileRouter>() {
  return {
    UploadButton: (
      props: React.ComponentProps<typeof UploadButton<TRouter>>,
    ) => {
      return <UploadButton {...props} />;
    },
    UploadDropzone: (
      props: React.ComponentProps<typeof UploadDropzone<TRouter>>,
    ) => {
      return <UploadDropzone {...props} />;
    },
    Uploader: (props: React.ComponentProps<typeof Uploader<TRouter>>) => {
      return <Uploader {...props} />;
    },
  };
}
