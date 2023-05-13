/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/no-unknown-property */
import type { FileRouter } from "uploadthing/server";
import { useUploadThing } from "./useUploadThing";
import { createSignal } from "solid-js";
import { OnDropHandler, createDropzone } from "solidjs-dropzone";
import {
  classNames,
  generateClientDropzoneAccept,
  generateMimeTypes,
} from "uploadthing/client";
import type { DANGEROUS__uploadFiles } from "uploadthing/client";

export type EndpointHelper<TRouter extends void | FileRouter> =
  void extends TRouter ? "YOU FORGOT TO PASS THE GENERIC" : keyof TRouter;

/**
 * @example
 * <UploadButton<OurFileRouter>
 *   endpoint="someEndpoint"
 *   onUploadComplete={(url) => console.log(url)}
 * />
 */
export function UploadButton<TRouter extends void | FileRouter = void>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>
  ) => void;
  onUploadError?: (error: Error) => void;
  url?: string;
  uploadedThing?: ReturnType<typeof useUploadThing>;
  multiple?: boolean;
}) {
  const uploadedThing =
    props.uploadedThing ??
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: props.onClientUploadComplete,
      onUploadError: props.onUploadError,
      url: props.url,
    });

  return (
    <div class="ut-flex ut-flex-col ut-gap-1 ut-items-center ut-justify-center">
      <label class="ut-bg-blue-600 ut-rounded-md ut-w-36 ut-h-10 ut-flex ut-items-center ut-justify-center ut-cursor-pointer">
        <input
          class="ut-hidden"
          type="file"
          multiple={props.multiple}
          accept={generateMimeTypes(
            uploadedThing.permittedFileInfo()?.fileTypes ?? []
          ).join(", ")}
          onChange={(e) => {
            e.target.files &&
              uploadedThing.startUpload(Array.from(e.target.files));
          }}
        />
        <span class="ut-px-3 ut-py-2 ut-text-white">
          {uploadedThing.isUploading() ? <Spinner /> : `Choose File`}
        </span>
      </label>
      <div class="ut-h-[1.25rem]">
        {uploadedThing.permittedFileInfo()?.fileTypes && (
          <p class="ut-text-xs ut-leading-5 ut-text-gray-600">
            {`${uploadedThing.permittedFileInfo()?.fileTypes.join(", ")}`}{" "}
            {uploadedThing.permittedFileInfo()?.maxSize &&
              `up to ${uploadedThing.permittedFileInfo()?.maxSize}`}
          </p>
        )}
      </div>
    </div>
  );
}

export const UploadDropzone = <
  TRouter extends void | FileRouter = void
>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>
  ) => void;
  onUploadError?: (error: Error) => void;
  url?: string;
  uploadedThing?: ReturnType<typeof useUploadThing>;
}) => {
  const uploadedThing =
    props.uploadedThing ??
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: props.onClientUploadComplete,
      onUploadError: props.onUploadError,
      url: props.url,
    });

  const [files, setFiles] = createSignal<File[]>([]);
  const onDrop: OnDropHandler = (acceptedFiles) => {
    setFiles(acceptedFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = createDropzone({
    onDrop,
    accept: uploadedThing.permittedFileInfo()?.fileTypes
      ? generateClientDropzoneAccept(
          uploadedThing.permittedFileInfo()?.fileTypes as any
        )
      : undefined,
    useFsAccessApi: true,
  });

  return (
    <div
      class={classNames(
        "ut-mt-2 ut-flex ut-justify-center ut-rounded-lg ut-border ut-border-dashed ut-border-gray-900/25 ut-px-6 ut-py-10",
        isDragActive ? "ut-bg-blue-600/10" : ""
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
          />
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
          {uploadedThing.permittedFileInfo()?.fileTypes && (
            <p class="ut-text-xs ut-leading-5 ut-text-gray-600">
              {`${uploadedThing.permittedFileInfo()?.fileTypes.join(", ")}`}{" "}
              {uploadedThing.permittedFileInfo()?.maxSize &&
                `up to ${uploadedThing.permittedFileInfo()?.maxSize}`}
            </p>
          )}
        </div>
        {files().length > 0 && (
          <div class="ut-mt-4 ut-flex ut-items-center ut-justify-center">
            <button
              class="ut-bg-blue-600 ut-rounded-md ut-w-36 ut-h-10 ut-flex ut-items-center ut-justify-center"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                uploadedThing.startUpload(files());
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

export const Uploader = <TRouter extends void | FileRouter = void>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>
  ) => void;
  onUploadError?: (error: Error) => void;
  url?: string;
  uploadedThing?: ReturnType<typeof useUploadThing>;
  buttonMultiple?: boolean;
}) => {
  const uploadedThing =
    props.uploadedThing ??
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: props.onClientUploadComplete,
      url: props.url,
      onUploadError: props.onUploadError,
    });
  return (
    <>
      <div class="flex flex-col items-center justify-center gap-4">
        <span class="text-4xl font-bold text-center">
          {`Upload a file using a button:`}
        </span>
        <UploadButton<TRouter>
          {...props}
          multiple={props.buttonMultiple}
          uploadedThing={uploadedThing}
        />
      </div>
      <div class="flex flex-col items-center justify-center gap-4">
        <span class="text-4xl font-bold text-center">
          {`...or using a dropzone:`}
        </span>
        <UploadDropzone<TRouter> {...props} uploadedThing={uploadedThing} />
      </div>
    </>
  );
};

const Spinner = () => {
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
};
