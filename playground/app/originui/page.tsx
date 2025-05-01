"use client";

import * as React from "react";
import {
  CheckCircleIcon,
  CheckIcon,
  FileArchiveIcon,
  FileIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  HeadphonesIcon,
  ImageIcon,
  Loader2Icon,
  PlusIcon,
  Trash2Icon,
  UploadIcon,
  VideoIcon,
  XIcon,
} from "lucide-react";
import { twMerge } from "tailwind-merge";

import {
  allowedContentTextLabelGenerator,
  bytesToFileSize,
} from "uploadthing/client";
import { AnyFile } from "uploadthing/client-future";
import { AnyFileRoute } from "uploadthing/types";

import { Button, buttonVariants } from "../../components/button";
import {
  future_uploadFiles,
  routeRegistry,
  useUploadThingDropzone,
} from "../../lib/uploadthing";

function Header() {
  return (
    <div className="my-16 text-center">
      <h1 className="font-heading text-foreground mb-3 text-4xl/[1.1] font-bold tracking-tight md:text-5xl/[1.1]">
        UploadThing x Origin UI
      </h1>
      <p className="text-muted-foreground mx-auto max-w-3xl text-lg">
        A collection of examples of using UploadThing with{" "}
        <a
          href="https://originui.com/file-upload?utm_source=uploadthing"
          className="hover:text-foreground underline"
        >
          Origin UI
        </a>
      </p>
    </div>
  );
}

function Grid(props: { children: React.ReactNode }) {
  return (
    <div className="*:not-first:-ms-px -m-px mx-auto grid grid-cols-12 p-16 *:px-1 *:py-12 sm:*:px-8 xl:*:px-12">
      {props.children}
    </div>
  );
}

function GridItem(props: { children: React.ReactNode }) {
  return (
    <div className="group/item relative col-span-12 border has-[[data-comp-loading=true]]:border-none sm:col-span-6 lg:col-span-4">
      {props.children}
    </div>
  );
}

export default function Page() {
  return (
    <>
      <Header />
      <Grid>
        <GridItem>
          <Comp546 />
        </GridItem>
        <GridItem>
          <Comp547 />
        </GridItem>
        <GridItem>
          <Comp552 />
        </GridItem>
        <GridItem>
          <Comp553 />
        </GridItem>
      </Grid>
    </>
  );
}

function Comp546() {
  const [isPending, startTransition] = React.useTransition();

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    routeConfig,
    files,
    removeFile,
    setFiles,
  } = useUploadThingDropzone({
    route: routeRegistry.images,
    disabled: isPending,
  });

  const uploadFiles = () => {
    startTransition(async () => {
      await future_uploadFiles((rr) => rr.images, {
        files: files.filter((f) => f.status === "pending"),
        input: {},
        onEvent: (event) => {
          setFiles((prev) =>
            prev.map((f) =>
              "file" in event && f === event.file ? event.file : f,
            ),
          );
        },
      });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        {...getRootProps()}
        data-dragging={isDragActive || undefined}
        data-files={files.length > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 not-data-[files]:justify-center relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
      >
        {files.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-medium">
                Files ({files.length})
              </h3>
              <div className="flex items-center gap-2">
                <label
                  className={twMerge(
                    buttonVariants({
                      variant: "outline",
                      size: "icon",
                    }),
                    "size-8",
                  )}
                >
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload image file"
                  />
                  <PlusIcon className="size-4 opacity-60" aria-hidden="true" />
                </label>
                <Button
                  size="sm"
                  disabled={
                    isPending ||
                    files.filter((f) => f.status === "pending").length === 0
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadFiles();
                  }}
                >
                  Upload
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {files.map((file, index) => (
                <div
                  key={file.key ?? index}
                  className="bg-accent relative aspect-square rounded-md"
                >
                  <img
                    src={file.status === "uploaded" ? file.url : file.preview}
                    alt={file.name}
                    className="size-full rounded-[inherit] object-cover"
                  />
                  <div className="absolute -right-2 -top-2">
                    {file.status === "uploaded" ? (
                      <div className="border-background flex size-6 items-center justify-center rounded-full border-2 bg-green-500">
                        <CheckIcon className="size-3.5 text-white" />
                      </div>
                    ) : file.status === "uploading" ||
                      (file.status === "pending" && file.key) ? (
                      <div className="text-muted-foreground/80 bg-background flex size-6 items-center justify-center rounded-full">
                        <Loader2Icon
                          aria-hidden="true"
                          className="size-3.5 animate-spin"
                        />
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file);
                        }}
                        size="icon"
                        className="border-background focus-visible:border-background size-6 rounded-full border-2 shadow-none"
                        aria-label="Remove image"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Drop your images here</p>
            <p className="text-muted-foreground text-xs">
              {allowedContentTextLabelGenerator(routeConfig)}
            </p>
            <label
              className={buttonVariants({
                variant: "outline",
                className: "mt-4",
              })}
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload image file"
              />
              <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
              Select images
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function Comp547() {
  const [isPending, startTransition] = React.useTransition();
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    routeConfig,
    files,
    clearFiles,
    removeFile,
    setFiles,
  } = useUploadThingDropzone({
    route: routeRegistry.images,
    disabled: isPending,
  });

  const uploadFiles = () => {
    startTransition(async () => {
      await future_uploadFiles((rr) => rr.images, {
        files: files.filter((f) => f.status === "pending"),
        input: {},
        onEvent: (event) => {
          setFiles((prev) =>
            prev.map((f) =>
              "file" in event && f === event.file ? event.file : f,
            ),
          );
        },
      });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        {...getRootProps()}
        data-dragging={isDragActive || undefined}
        data-files={files.length > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 not-data-[files]:justify-center relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
      >
        <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
          <div
            className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
            aria-hidden="true"
          >
            <ImageIcon className="size-4 opacity-60" />
          </div>
          <p className="mb-1.5 text-sm font-medium">Drop your images here</p>
          <p className="text-muted-foreground text-xs">
            {allowedContentTextLabelGenerator(routeConfig)}
          </p>
          <label
            className={buttonVariants({
              variant: "outline",
              className: "mt-4",
            })}
          >
            <input
              {...getInputProps()}
              className="sr-only"
              aria-label="Upload image file"
            />
            <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
            Select images
          </label>
        </div>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={file.key ?? index}
              className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-accent aspect-square shrink-0 rounded">
                  <img
                    src={file.status === "uploaded" ? file.url : file.preview}
                    alt={file.name}
                    className="size-10 rounded-[inherit] object-cover"
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-[13px] font-medium">
                    {file.name}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {bytesToFileSize(file.size)}
                  </p>
                </div>
              </div>

              {file.status === "uploaded" ? (
                <CheckCircleIcon
                  aria-hidden="true"
                  className="size-4 text-green-500"
                />
              ) : file.status === "uploading" ||
                (file.status === "pending" && file.key) ? (
                <div className="text-muted-foreground/80 flex items-center gap-1 text-xs">
                  <span>{Math.round((file.sent / file.size) * 100)}%</span>
                  <Loader2Icon
                    aria-hidden="true"
                    className="size-4 animate-spin"
                  />
                </div>
              ) : file.status === "pending" ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                  onClick={() => removeFile(file)}
                  aria-label="Remove file"
                >
                  <XIcon aria-hidden="true" />
                </Button>
              ) : null}
            </div>
          ))}

          {/* Controls */}
          {files.length > 0 && (
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={clearFiles}
                disabled={isPending}
              >
                Clear
              </Button>
              <Button
                size="sm"
                disabled={
                  isPending ||
                  files.filter((f) => f.status === "pending").length === 0
                }
                onClick={uploadFiles}
              >
                Upload
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const getFileIcon = (file: AnyFile<AnyFileRoute>) => {
  const iconMap = {
    pdf: {
      icon: FileTextIcon,
      conditions: (type: string, name: string) =>
        type.includes("pdf") ||
        name.endsWith(".pdf") ||
        type.includes("word") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx"),
    },
    archive: {
      icon: FileArchiveIcon,
      conditions: (type: string, name: string) =>
        type.includes("zip") ||
        type.includes("archive") ||
        name.endsWith(".zip") ||
        name.endsWith(".rar"),
    },
    excel: {
      icon: FileSpreadsheetIcon,
      conditions: (type: string, name: string) =>
        type.includes("excel") ||
        name.endsWith(".xls") ||
        name.endsWith(".xlsx"),
    },
    video: {
      icon: VideoIcon,
      conditions: (type: string) => type.includes("video/"),
    },
    audio: {
      icon: HeadphonesIcon,
      conditions: (type: string) => type.includes("audio/"),
    },
    image: {
      icon: ImageIcon,
      conditions: (type: string) => type.startsWith("image/"),
    },
  };

  for (const { icon: Icon, conditions } of Object.values(iconMap)) {
    if (conditions(file.type, file.name)) {
      return <Icon className="size-5 opacity-60" />;
    }
  }

  return <FileIcon className="size-5 opacity-60" />;
};

const getFilePreview = (file: AnyFile<AnyFileRoute> & { preview?: string }) => {
  const renderImage = (src: string) => (
    <img
      src={src}
      alt={file.name}
      className="size-full rounded-t-[inherit] object-cover"
    />
  );

  const src = file.status === "uploaded" ? file.url : file.preview;

  return (
    <div className="bg-accent flex aspect-square items-center justify-center overflow-hidden rounded-t-[inherit]">
      {file.type.startsWith("image/") && src
        ? renderImage(src)
        : getFileIcon(file)}
    </div>
  );
};

function Comp552() {
  const [isPending, startTransition] = React.useTransition();
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    routeConfig,
    files,
    clearFiles,
    removeFile,
    setFiles,
  } = useUploadThingDropzone({
    route: routeRegistry.anyPublic,
    disabled: isPending,
  });

  const uploadFiles = () => {
    startTransition(async () => {
      await future_uploadFiles((rr) => rr.anyPublic, {
        files: files.filter((f) => f.status === "pending"),
        input: {},
        onEvent: (event) => {
          setFiles((prev) =>
            prev.map((f) =>
              "file" in event && f === event.file ? event.file : f,
            ),
          );
        },
      });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        {...getRootProps()}
        data-dragging={isDragActive || undefined}
        data-files={files.length > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 not-data-[files]:justify-center relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
      >
        {files.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-medium">
                Files ({files.length})
              </h3>
              <div className="flex gap-2">
                <label
                  className={twMerge(
                    buttonVariants({
                      variant: "outline",
                      size: "sm",
                    }),
                    "size-8",
                  )}
                >
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload files"
                  />
                  <PlusIcon
                    className="size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFiles();
                  }}
                >
                  <Trash2Icon
                    className="size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  size="sm"
                  disabled={
                    isPending ||
                    files.filter((f) => f.status === "pending").length === 0
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadFiles();
                  }}
                >
                  Upload
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {files.map((file, index) => (
                <div
                  key={file.key ?? index}
                  className="bg-background relative flex flex-col rounded-md border"
                >
                  {getFilePreview(file)}
                  <div className="absolute -right-2 -top-2">
                    {file.status === "uploaded" ? (
                      <div className="border-background flex size-6 items-center justify-center rounded-full border-2 bg-green-500">
                        <CheckIcon className="size-3.5 text-white" />
                      </div>
                    ) : file.status === "uploading" ||
                      (file.status === "pending" && file.key) ? (
                      <div className="text-muted-foreground/80 bg-background flex size-6 items-center justify-center rounded-full">
                        <Loader2Icon
                          aria-hidden="true"
                          className="size-3.5 animate-spin"
                        />
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file);
                        }}
                        size="icon"
                        className="border-background focus-visible:border-background size-6 rounded-full border-2 shadow-none"
                        aria-label="Remove image"
                      >
                        <XIcon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col gap-0.5 border-t p-3">
                    <p className="truncate text-[13px] font-medium">
                      {file.name}
                    </p>
                    <p className="text-muted-foreground truncate text-xs">
                      {bytesToFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Drop your files here</p>
            <p className="text-muted-foreground text-xs">
              {allowedContentTextLabelGenerator(routeConfig)}
            </p>
            <label
              className={buttonVariants({
                variant: "outline",
                className: "mt-4",
              })}
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload files"
              />
              <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
              Select files
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

function Comp553() {
  const [isPending, startTransition] = React.useTransition();

  const {
    routeConfig,
    getRootProps,
    getInputProps,
    isDragActive,
    files,
    removeFile,
    clearFiles,
    setFiles,
  } = useUploadThingDropzone({
    route: routeRegistry.anyPublic,
    disabled: isPending,
  });

  const uploadFiles = () => {
    startTransition(async () => {
      await future_uploadFiles((rr) => rr.anyPublic, {
        files: files.filter((f) => f.status === "pending"),
        input: {},
        onEvent: (event) => {
          setFiles((prev) =>
            prev.map((f) =>
              "file" in event && f === event.file ? event.file : f,
            ),
          );
        },
      });
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Drop area */}
      <div
        {...getRootProps()}
        data-dragging={isDragActive || undefined}
        data-files={files.length > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 not-data-[files]:justify-center relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors has-[input:focus]:ring-[3px]"
      >
        {files.length > 0 ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-medium">
                Files ({files.length})
              </h3>
              <div className="flex gap-2">
                <label
                  className={twMerge(
                    buttonVariants({
                      variant: "outline",
                      size: "icon",
                    }),
                    "size-8",
                  )}
                >
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload file"
                  />
                  <PlusIcon
                    className="size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                </label>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFiles();
                  }}
                >
                  <Trash2Icon
                    className="size-3.5 opacity-60"
                    aria-hidden="true"
                  />
                </Button>
                <Button
                  size="sm"
                  disabled={
                    isPending ||
                    files.filter((f) => f.status === "pending").length === 0
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    uploadFiles();
                  }}
                >
                  Upload
                </Button>
              </div>
            </div>

            <div className="w-full space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.key ?? index}
                  data-uploading={file.status === "uploading" || undefined}
                  className="bg-background flex flex-col gap-1 rounded-lg border p-2 pe-3 transition-opacity duration-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="in-data-[uploading=true]:opacity-50 flex items-center gap-3 overflow-hidden">
                      <div className="flex aspect-square size-10 shrink-0 items-center justify-center rounded border">
                        {getFilePreview(file)}
                      </div>
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <p className="truncate text-[13px] font-medium">
                          {file.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {bytesToFileSize(file.size)}
                        </p>
                      </div>
                    </div>

                    {file.status === "uploaded" ? (
                      <CheckCircleIcon
                        aria-hidden="true"
                        className="size-4 shrink-0 text-green-500"
                      />
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(file);
                        }}
                        aria-label="Remove file"
                      >
                        <XIcon className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>

                  {/* Upload progress bar */}
                  {(file.status === "uploading" ||
                    (file.status === "pending" && file.key)) &&
                    (() => {
                      const progress = Math.round(
                        (file.sent / file.size) * 100,
                      );

                      return (
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                              className="bg-primary h-full transition-all duration-300 ease-out"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-muted-foreground w-10 text-xs tabular-nums">
                            {progress}%
                          </span>
                        </div>
                      );
                    })()}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
            <div
              className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border"
              aria-hidden="true"
            >
              <ImageIcon className="size-4 opacity-60" />
            </div>
            <p className="mb-1.5 text-sm font-medium">Drop your files here</p>
            <p className="text-muted-foreground text-xs">
              {allowedContentTextLabelGenerator(routeConfig)}
            </p>
            <label
              className={buttonVariants({
                variant: "outline",
                className: "mt-4",
              })}
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload file"
              />
              <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
              Select files
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
