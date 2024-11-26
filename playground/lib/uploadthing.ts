import { useDropzone } from "@uploadthing/react";
import { useState } from "react";
import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadPrimitives,
} from "@uploadthing/react";
import { UploadRouter } from "../app/api/uploadthing/route";
import {
  AnyFile,
  future_genUploader,
  generateClientDropzoneAccept,
  generatePermittedFileTypes,
  makePendingFile,
  PendingFile,
} from "uploadthing/client-future";
import { AnyFileRoute } from "uploadthing/types";

export const {
  uploadFiles: future_uploadFiles,
  createUpload: future_createUpload,
  routeRegistry,
} = future_genUploader<UploadRouter>();

export function useUploadThingDropzone<
  TFileRoute extends keyof UploadRouter,
>(props: {
  route: TFileRoute;
  onDrop?: (files: PendingFile[]) => void;
  disabled?: boolean;
}) {
  const [files, setFiles] = useState<
    (AnyFile<UploadRouter[TFileRoute]> & { preview?: string })[]
  >([]);

  const clearFiles = () => {
    files.forEach((file) => {
      if ("preview" in file && typeof file.preview === "string") {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
  };

  const removeFile = (file: AnyFile<AnyFileRoute>) => {
    if ("preview" in file && typeof file.preview === "string") {
      URL.revokeObjectURL(file.preview);
    }
    setFiles((prev) => prev.filter((f) => f !== file));
  };

  const { routeConfig } = useUploadThing(props.route);

  const { fileTypes, multiple } = generatePermittedFileTypes(routeConfig);
  const dropzone = useDropzone({
    accept: generateClientDropzoneAccept(fileTypes),
    multiple,
    disabled: props.disabled,
    onDrop: (acceptedFiles) => {
      const pendingFiles = acceptedFiles.map((file) => {
        const pendingFile = makePendingFile(file);
        const preview = file.type.startsWith("image")
          ? URL.createObjectURL(file)
          : undefined;
        return Object.assign(pendingFile, { preview });
      });
      setFiles((prev) => [...prev, ...pendingFiles]);
      props.onDrop?.(pendingFiles);
    },
  });

  return { ...dropzone, routeConfig, files, clearFiles, removeFile, setFiles };
}

export const UT = generateUploadPrimitives<UploadRouter>();
export const UTButton = generateUploadButton<UploadRouter>();
export const { useUploadThing } = generateReactHelpers<UploadRouter>();
