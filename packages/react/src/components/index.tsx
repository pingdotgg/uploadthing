import type { ComponentProps, JSXElementConstructor } from "react";
import { Effect } from "effect";

import { resolveMaybeUrlArg } from "uploadthing/client";
import type { FileRouter } from "uploadthing/server";

import type { GenerateTypedHelpersOptions } from "../types";
import { UploadButton } from "./button";
import { UploadDropzone } from "./dropzone";
import { Uploader } from "./uploader";

export { UploadButton, UploadDropzone, Uploader };

type OmitInitOpts<
  T extends keyof JSX.IntrinsicElements | JSXElementConstructor<any>,
> = Omit<ComponentProps<T>, keyof GenerateTypedHelpersOptions>;

export const generateUploadButton = <TRouter extends FileRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = Effect.runSync(resolveMaybeUrlArg(opts?.url));

  const TypedButton = <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    props: OmitInitOpts<typeof UploadButton<TRouter, TEndpoint, TSkipPolling>>,
  ) => (
    <UploadButton<TRouter, TEndpoint, TSkipPolling>
      {...(props as any)}
      url={url}
    />
  );
  return TypedButton;
};

export const generateUploadDropzone = <TRouter extends FileRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = Effect.runSync(resolveMaybeUrlArg(opts?.url));

  const TypedDropzone = <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    props: OmitInitOpts<
      typeof UploadDropzone<TRouter, TEndpoint, TSkipPolling>
    >,
  ) => (
    <UploadDropzone<TRouter, TEndpoint, TSkipPolling>
      {...(props as any)}
      url={url}
    />
  );
  return TypedDropzone;
};

export const generateUploader = <TRouter extends FileRouter>(
  opts?: GenerateTypedHelpersOptions,
) => {
  const url = Effect.runSync(resolveMaybeUrlArg(opts?.url));

  const TypedUploader = <
    TEndpoint extends keyof TRouter,
    TSkipPolling extends boolean = false,
  >(
    props: OmitInitOpts<typeof Uploader<TRouter, TEndpoint, TSkipPolling>>,
  ) => (
    <Uploader<TRouter, TEndpoint, TSkipPolling> {...(props as any)} url={url} />
  );
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
