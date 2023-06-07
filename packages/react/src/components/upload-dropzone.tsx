import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import type { FileWithPath } from "react-dropzone";
import { twMerge } from "tailwind-merge";

import { generateClientDropzoneAccept } from "uploadthing/client";
import type { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";

import { useUploadThing } from "../useUploadThing";
import {
  allowedContentTextLabelGenerator,
  generatePermittedFileTypes,
  Spinner,
} from "./component-helpers";
import type { EndpointHelper } from "./component-helpers";

export const UploadDropzone = <
  TRouter extends void | FileRouter = void,
>(props: {
  endpoint: EndpointHelper<TRouter>;
  onClientUploadComplete?: (
    res?: Awaited<ReturnType<typeof DANGEROUS__uploadFiles>>,
  ) => void;
  onUploadError?: (error: Error) => void;
}) => {
  const { startUpload, isUploading, permittedFileInfo } =
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: props.onClientUploadComplete,
      onUploadError: props.onUploadError,
    });

  const [files, setFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    setFiles(acceptedFiles);
  }, []);

  const { fileTypes } = generatePermittedFileTypes(permittedFileInfo?.config);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: fileTypes ? generateClientDropzoneAccept(fileTypes) : undefined,
  });

  return (
    <div
      className={twMerge(
        "mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10",
        isDragActive ? "bg-blue-600/10" : "",
      )}
    >
      <div className="text-center" {...getRootProps()}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          className="mx-auto h-12 w-12 text-gray-400"
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765a4.5 4.5 0 0 1 8.302-3.046a3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z"
            clipRule="evenodd"
          ></path>
        </svg>
        <div className="mt-4 flex text-sm leading-6 text-gray-600">
          <label
            htmlFor="file-upload"
            className="focus-within:ut-outline-none focus-within:ut-ring-2 focus-within:ut-ring-blue-600 focus-within:ut-ring-offset-2 hover:ut-text-blue-500 relative cursor-pointer font-semibold text-blue-600"
          >
            {`Choose files`}
            <input className="sr-only" {...getInputProps()} />
          </label>
          <p className="pl-1">{`or drag and drop`}</p>
        </div>
        <div className="h-[1.25rem]">
          <p className="text-xs leading-5 text-gray-600">
            {allowedContentTextLabelGenerator(permittedFileInfo?.config)}
          </p>
        </div>
        {files.length > 0 && (
          <div className="mt-4 flex items-center justify-center">
            <button
              className="flex h-10 w-36 items-center justify-center rounded-md bg-blue-600"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!files) return;

                void startUpload(files);
              }}
            >
              <span className="px-3 py-2 text-white">
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
