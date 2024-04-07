"use client";

import { Suspense, use } from "react";
import { Loader2, UploadIcon, XIcon } from "lucide-react";

import { generatePermittedFileTypes } from "@uploadthing/shared";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useUploadThing } from "~/utils/uploadthing";

const fileToDataURL = async (file: File) => {
  const reader = new FileReader();
  return new Promise<string>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function Uploader() {
  const {
    startUpload,
    getInputProps,
    files,
    setFiles,
    isUploading,
    uploadProgress,
    permittedFileInfo,
  } = useUploadThing("videoAndImage");
  const { fileTypes } = generatePermittedFileTypes(permittedFileInfo?.config);

  return (
    <div className="grid w-full gap-4 px-4">
      <div className="mx-auto flex w-1/2 flex-col gap-4">
        <div className="flex items-center justify-center gap-4 rounded-lg border border-dashed border-gray-300 p-6 text-center dark:border-gray-800">
          <div className="grid gap-1.5">
            <Label className="dark:peer-overflow-hidden peer-overflow-hidden flex w-full cursor-pointer items-center gap-2 rounded-md border border-gray-300 p-4 text-sm transition-colors [&:has(:focus)]:outline-none [&:has(:focus)]:ring-2 [&:has(:focus)]:ring-gray-200 dark:[&:has(:focus)]:ring-gray-800">
              <UploadIcon className="h-6 w-6" />
              <span className="peer-overflow-ellipsis">
                Choose a file to upload
              </span>
              <Input
                className="sr-only"
                {...getInputProps({ mode: "manual" })}
              />
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Supported file types: {fileTypes.join(", ")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="flex"
          onClick={() => startUpload(files)}
          disabled={isUploading}
        >
          {isUploading ? (
            <span>
              <Loader2 /> Uploading... {uploadProgress?.toFixed(2)}%
            </span>
          ) : (
            <span>Upload</span>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {files.map((file) => (
          <Suspense fallback={null}>
            <PreviewCard
              file={file}
              deselect={() =>
                setFiles((files) => files.filter((f) => f !== file))
              }
            />
          </Suspense>
        ))}
      </div>
    </div>
  );
}

function PreviewCard(props: { file: File; deselect: () => void }) {
  const data = use(fileToDataURL(props.file));

  return (
    <Card className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">{props.file.name}</span>
        <Button className="h-max w-max p-1" onClick={props.deselect}>
          <XIcon className="h-4 w-4" />
          <span className="sr-only">Remove</span>
        </Button>
      </div>
      <img
        alt={`Preview of ${props.file.name}`}
        className="aspect-[4/3] overflow-hidden rounded-lg object-cover"
        src={data}
      />
    </Card>
  );
}
