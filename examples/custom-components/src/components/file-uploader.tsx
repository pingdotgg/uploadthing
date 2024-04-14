import "client-only";

import * as React from "react";
import Image from "next/image";
import { Cross2Icon, UploadIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { useDropzone } from "@uploadthing/react";
import { bytesToHumanReadable } from "uploadthing/client";

import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { useUploadThing } from "~/uploadthing/client";

interface FileUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function FileUploader({
  files,
  onFilesChange,
  className,
  ...dropzoneProps
}: FileUploaderProps) {
  const { routeConfig, progresses, startUpload } = useUploadThing(
    "imageUploader",
    {
      files,
      onFilesChange,
      skipPolling: true,
    },
  );

  const onDrop = React.useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        }),
      );

      const updatedFiles = files ? [...files, ...newFiles] : newFiles;
      onFilesChange?.(updatedFiles);
    },
    [files],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    routeConfig,
  });

  // Revoke preview url when component unmounts
  React.useEffect(() => {
    return () => {
      if (!files) return;
      files.forEach((file) => {
        if (isFileWithPreview(file)) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  return (
    <div className="relative flex flex-col gap-6 overflow-hidden">
      <div
        {...getRootProps()}
        className={twMerge(
          "border-muted-foreground/25 hover:bg-muted/25 group relative grid h-52 w-full cursor-pointer place-items-center rounded-lg border-2 border-dashed px-5 py-2.5 text-center transition",
          "ring-offset-background focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          isDragActive && "border-muted-foreground/50",
          // isDisabled && "pointer-events-none opacity-60",
          className,
        )}
        {...dropzoneProps}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
            <div className="rounded-full border border-dashed p-3">
              <UploadIcon
                className="text-muted-foreground size-7"
                aria-hidden="true"
              />
            </div>
            <p className="text-muted-foreground font-medium">
              Drop the files here
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 sm:px-5">
            <div className="rounded-full border border-dashed p-3">
              <UploadIcon
                className="text-muted-foreground size-7"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-px">
              <p className="text-muted-foreground font-medium">
                Drag {`'n'`} drop files here, or click to select files
              </p>
              <p className="text-muted-foreground/70 text-sm">You can upload</p>
            </div>
          </div>
        )}
      </div>

      {files?.length ? (
        <div className="max-h-48 space-y-4">
          {files?.map((file, index) => (
            <FileCard
              key={index}
              file={file}
              onRemove={() => {
                if (!files) return;
                const newFiles = files.filter((_, i) => i !== index);
                onFilesChange?.(newFiles);
              }}
              progress={progresses.get(file.name)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface FileCardProps {
  file: File;
  onRemove: () => void;
  progress?: number;
}

function FileCard({ file, progress, onRemove }: FileCardProps) {
  return (
    <div className="relative flex items-center space-x-4">
      <div className="flex flex-1 space-x-4">
        {isFileWithPreview(file) ? (
          <Image
            src={file.preview}
            alt={file.name}
            width={48}
            height={48}
            loading="lazy"
            className="aspect-square shrink-0 rounded-md object-cover"
          />
        ) : null}
        <div className="flex w-full flex-col gap-2">
          <div className="space-y-px">
            <p className="text-foreground/80 line-clamp-1 text-sm font-medium">
              {file.name}
            </p>
            <p className="text-muted-foreground text-xs">
              {bytesToHumanReadable(file.size)}
            </p>
          </div>
          <Progress value={progress} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-7"
          onClick={onRemove}
        >
          <Cross2Icon className="size-4 " aria-hidden="true" />
          <span className="sr-only">Remove file</span>
        </Button>
      </div>
    </div>
  );
}

function isFileWithPreview(file: File): file is File & { preview: string } {
  return "preview" in file && typeof file.preview === "string";
}
