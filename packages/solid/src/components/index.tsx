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

/**
 * @deprecated - use {@link generateUploadButton}, {@link generateUploadDropzone}, and {@link generateUploader} instead
 */
export function generateComponents<TRouter extends FileRouter>(
  initOpts?: GenerateTypedHelpersOptions,
) {
  return {
    UploadButton: generateUploadButton<TRouter>(initOpts),
    UploadDropzone: generateUploadDropzone<TRouter>(initOpts),
    Uploader: generateUploader<TRouter>(initOpts),
  };
}
