import { twMerge } from "tailwind-merge";

import { generateMimeTypes } from "uploadthing/client";
import type { DANGEROUS__uploadFiles } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";

import { useUploadThing } from "../useUploadThing";
import type { EndpointHelper } from "./component-helpers";
import {
  allowedContentTextLabelGenerator,
  generatePermittedFileTypes,
  Spinner,
} from "./component-helpers";

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

  /* Custom style the button */
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { startUpload, isUploading, permittedFileInfo } =
    useUploadThing<string>({
      endpoint: props.endpoint as string,
      onClientUploadComplete: props.onClientUploadComplete,
      onUploadError: props.onUploadError,
    });

  const { fileTypes, multiple } = generatePermittedFileTypes(
    permittedFileInfo?.config,
  );

  const { className, size = "md" } = props;

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <label
        className={twMerge(
          "flex cursor-pointer items-center justify-center rounded-md",
          "bg-blue-600 hover:bg-blue-700 focus:bg-blue-700",
          size === "sm" && "h-9 w-32 text-sm",
          size === "md" && "h-10 w-36",
          size === "lg" && "h-12 w-44 text-lg",
          className,
        )}
      >
        <input
          className="hidden"
          type="file"
          multiple={multiple}
          accept={generateMimeTypes(fileTypes ?? [])?.join(", ")}
          onChange={(e) => {
            if (!e.target.files) return;
            void startUpload(Array.from(e.target.files));
          }}
        />
        <span className="px-3 py-2 text-white">
          {isUploading ? <Spinner /> : `Choose File${multiple ? `(s)` : ``}`}
        </span>
      </label>
      <div className="h-[1.25rem]">
        {fileTypes && (
          <p className="text-xs leading-5 text-gray-600">
            {allowedContentTextLabelGenerator(permittedFileInfo?.config)}
          </p>
        )}
      </div>
    </div>
  );
}
