import { resolveMaybeUrlArg } from "@uploadthing/shared";
import type { FileRouter } from "uploadthing/types";

import type {
  GenerateTypedHelpersOptions,
  UploadthingComponentProps,
} from "../types";
import type { UploadButtonProps } from "./button";
import { UploadButton } from "./button";
import type { UploadDropzoneProps } from "./dropzone";
import { UploadDropzone } from "./dropzone";
import * as primitives from "./primitive";
import { RootPrimitiveComponentProps } from "./primitive/root";
import { Uploader } from "./uploader";

export { UploadButton, UploadDropzone, Uploader };

export const generateUploadButton = <TRouter extends FileRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(opts?.url);

  const TypedButton = <TEndpoint extends keyof TRouter>(
    props: Omit<
      UploadButtonProps<TRouter, TEndpoint>,
      keyof GenerateTypedHelpersOptions
    >,
  ) => <UploadButton<TRouter, TEndpoint> {...(props as any)} url={url} />;
  return TypedButton;
};

export const generateUploadDropzone = <TRouter extends FileRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(opts?.url);

  const TypedDropzone = <TEndpoint extends keyof TRouter>(
    props: Omit<
      UploadDropzoneProps<TRouter, TEndpoint>,
      keyof GenerateTypedHelpersOptions
    >,
  ) => <UploadDropzone<TRouter, TEndpoint> {...(props as any)} url={url} />;
  return TypedDropzone;
};

export const generateUploadPrimitives = <TRouter extends FileRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(opts?.url);

  const TypedUploadRoot = <TEndpoint extends keyof TRouter>(
    props: Omit<
      RootPrimitiveComponentProps<TRouter, TEndpoint>,
      keyof GenerateTypedHelpersOptions
    >,
  ) => <primitives.Root<TRouter, TEndpoint> {...(props as any)} url={url} />;
  return { ...primitives, Root: TypedUploadRoot };
};

export const generateUploader = <TRouter extends FileRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = resolveMaybeUrlArg(opts?.url);

  const TypedUploader = <TEndpoint extends keyof TRouter>(
    props: Omit<
      UploadthingComponentProps<TRouter, TEndpoint>,
      keyof GenerateTypedHelpersOptions
    >,
  ) => <Uploader<TRouter, TEndpoint> {...(props as any)} url={url} />;
  return TypedUploader;
};
