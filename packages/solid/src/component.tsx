/* eslint-disable react-hooks/rules-of-hooks */
import { createSignal } from "solid-js";
import type { OnDropHandler } from "solidjs-dropzone";
import { createDropzone } from "solidjs-dropzone";

import type { ExpandedRouteConfig } from "@uploadthing/shared";
import {
  classNames,
  generateClientDropzoneAccept,
  generateMimeTypes,
} from "uploadthing/client";
import type { UploadFileType } from "uploadthing/client";
import type {
  ErrorMessage,
  FileRouter,
  inferEndpointInput,
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

  const formattedTypes = allowedTypes.map((f) => (f === "blob" ? "file" : f));

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

    onClientUploadComplete?: (
      res?: Awaited<ReturnType<UploadFileType<TRouter>>>,
    ) => void;
    onUploadError?: (error: Error) => void;
    url?: string;
    uploadedThing?: ReturnType<
      ReturnType<typeof INTERNAL_uploadthingHookGen<TRouter>>
    >;
    multiple?: boolean;
  } & (undefined extends inferEndpointInput<TRouter[TEndpoint]>
    ? {}
    : {
        input: inferEndpointInput<TRouter[TEndpoint]>;
      });
}[keyof TRouter];

/**
 * @example
 * <UploadButton<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(url) => console.log(url)}
 * />
 */
export function UploadButton<TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter>,
) {
  const $props = props as UploadthingComponentProps<TRouter>;
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
  const uploadedThing =
    $props.uploadedThing ??
    useUploadThing($props.endpoint, {
      onClientUploadComplete: $props.onClientUploadComplete,
      onUploadError: $props.onUploadError,
      url: $props.url,
    });

  const fileInfo = () =>
    generatePermittedFileTypes(uploadedThing.permittedFileInfo()?.config);

  return (
    <div class="ut-flex ut-flex-col ut-gap-1 ut-items-center ut-justify-center">
      <label class="ut-bg-blue-600 ut-rounded-md ut-w-36 ut-h-10 ut-flex ut-items-center ut-justify-center ut-cursor-pointer">
        <input
          class="ut-hidden"
          type="file"
          multiple={fileInfo().multiple}
          accept={generateMimeTypes(fileInfo().fileTypes ?? [])?.join(", ")}
          onChange={(e) => {
            if (!e.target.files) return;
            const input = "input" in $props ? $props.input : undefined;
            const files = Array.from(e.target.files);
            void uploadedThing.startUpload(files, input);
          }}
        />
        <span class="ut-px-3 ut-py-2 ut-text-white">
          {uploadedThing?.isUploading() ? (
            <Spinner />
          ) : (
            `Choose File${$props.multiple ? `(s)` : ``}`
          )}
        </span>
      </label>
      <div class="ut-h-[1.25rem]">
        {fileInfo().fileTypes ? (
          <p class="ut-text-xs ut-leading-5 ut-text-gray-600">
            {allowedContentTextLabelGenerator(
              uploadedThing.permittedFileInfo()?.config,
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const UploadDropzone = <TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter>,
) => {
  const $props = props as UploadthingComponentProps<TRouter>;
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();
  const uploadedThing =
    $props.uploadedThing ??
    useUploadThing($props.endpoint, {
      onClientUploadComplete: $props.onClientUploadComplete,
      onUploadError: $props.onUploadError,
      url: $props.url,
    });

  const [files, setFiles] = createSignal<File[]>([]);
  const onDrop: OnDropHandler = (acceptedFiles) => {
    setFiles(acceptedFiles);
  };
  const uploadInfo = () =>
    generatePermittedFileTypes(uploadedThing.permittedFileInfo()?.config);

  const { getRootProps, getInputProps, isDragActive } = createDropzone({
    onDrop,
    get accept() {
      return uploadInfo().fileTypes
        ? generateClientDropzoneAccept(uploadInfo()?.fileTypes ?? [])
        : undefined;
    },
    useFsAccessApi: true,
  });

  return (
    <div
      class={classNames(
        "ut-mt-2 ut-flex ut-justify-center ut-rounded-lg ut-border ut-border-dashed ut-border-gray-900/25 ut-px-6 ut-py-10",
        isDragActive ? "ut-bg-blue-600/10" : "",
      )}
    >
      <div class="text-center" {...getRootProps()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          class="ut-mx-auto ut-h-12 ut-w-12 ut-text-gray-400"
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
            class="ut-relative ut-cursor-pointer ut-font-semibold ut-text-blue-600 focus-within:ut-outline-none focus-within:ut-ring-2 focus-within:ut-ring-blue-600 focus-within:ut-ring-offset-2 hover:ut-text-blue-500"
          >
            {`Choose files`}
            <input class="ut-sr-only" {...getInputProps()} />
          </label>
          <p class="ut-pl-1">{`or drag and drop`}</p>
        </div>
        <div class="ut-h-[1.25rem]">
          <p class="ut-text-xs ut-leading-5 ut-text-gray-600">
            {allowedContentTextLabelGenerator(
              uploadedThing.permittedFileInfo()?.config,
            )}
          </p>
        </div>
        {files.length > 0 && (
          <div class="ut-mt-4 ut-flex ut-items-center ut-justify-center">
            <button
              class="ut-bg-blue-600 ut-rounded-md ut-w-36 ut-h-10 ut-flex ut-items-center ut-justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!files()) return;

                const input = "input" in $props ? $props.input : undefined;
                void uploadedThing.startUpload(files(), input);
              }}
            >
              <span class="ut-px-3 ut-py-2 ut-text-white">
                {uploadedThing.isUploading() ? (
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

export const Uploader = <TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter>,
) => {
  const $props = props as UploadthingComponentProps<TRouter>;
  const useUploadThing = INTERNAL_uploadthingHookGen<TRouter>();

  const uploadedThing =
    $props.uploadedThing ??
    useUploadThing<string>($props.endpoint as string, {
      onClientUploadComplete: $props.onClientUploadComplete,
      url: $props.url,
      onUploadError: $props.onUploadError,
    });
  return (
    <>
      <div class="flex flex-col items-center justify-center gap-4">
        <span class="text-center text-4xl font-bold">
          {`Upload a file using a button:`}
        </span>
        {/* @ts-expect-error - we know this is valid from the check above */}
        <UploadButton<TRouter> {...$props} uploadedThing={uploadedThing} />
      </div>
      <div class="flex flex-col items-center justify-center gap-4">
        <span class="text-center text-4xl font-bold">
          {`...or using a dropzone:`}
        </span>
        {/* @ts-expect-error - we know this is valid from the check above */}
        <UploadDropzone<TRouter> {...$props} uploadedThing={uploadedThing} />
      </div>
    </>
  );
};

function Spinner() {
  return (
    <svg
      class="ut-animate-spin ut-h-5 ut-w-5 ut-text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 576 512"
    >
      <path
        fill="currentColor"
        d="M256 32C256 14.33 270.3 0 288 0C429.4 0 544 114.6 544 256C544 302.6 531.5 346.4 509.7 384C500.9 399.3 481.3 404.6 465.1 395.7C450.7 386.9 445.5 367.3 454.3 351.1C470.6 323.8 480 291 480 255.1C480 149.1 394 63.1 288 63.1C270.3 63.1 256 49.67 256 31.1V32z"
      ></path>
    </svg>
  );
}
