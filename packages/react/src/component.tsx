import type { ComponentProps } from "react";

import { getFullApiUrl } from "uploadthing/client";
import type { ErrorMessage, FileRouter } from "uploadthing/server";

import { UploadButton } from "./components/button";
import { UploadDropzone } from "./components/dropzone";
import type { UploadthingComponentProps } from "./types";

export function Uploader<
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter, TEndpoint>,
) {
  return (
    <>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`Upload a file using a button:`}
        </span>
        {/* @ts-expect-error - this is validated above */}
        <UploadButton<TRouter> {...props} />
      </div>
      <div className="flex flex-col items-center justify-center gap-4">
        <span className="text-center text-4xl font-bold">
          {`...or using a dropzone:`}
        </span>
        {/* @ts-expect-error - this is validated above */}
        <UploadDropzone<TRouter> {...props} />
      </div>
    </>
  );
}

export function generateComponents<TRouter extends FileRouter>(initOpts?: {
  /**
   * URL to the UploadThing API endpoint
   * @example "/api/uploadthing"
   * @example "https://www.example.com/api/uploadthing"
   *
   * If relative, host will be inferred from either the `VERCEL_URL` environment variable or `window.location.origin`
   *
   * @default (VERCEL_URL ?? window.location.origin) + "/api/uploadthing"
   */
  url?: string | URL;
  /**
   * Optional headers to send with the request to your server
   * Can be used to force the request to the same instance if
   * your app is running on multiple nodes.
   * Note: `Content-Type` cannot be overridden and will always be `application/json`
   * @example { 'fly-force-instance-id': 'my-instance-id' }
   */
  headers?: HeadersInit;
}) {
  const url =
    initOpts?.url instanceof URL ? initOpts.url : getFullApiUrl(initOpts?.url);
  const headers = new Headers(initOpts?.headers);

  return {
    UploadButton: <TEndpoint extends keyof TRouter>(
      props: Omit<
        ComponentProps<typeof UploadButton<TRouter, TEndpoint>>,
        "url" | "headers"
      >,
    ) => (
      <UploadButton<TRouter, TEndpoint>
        {...(props as any)}
        url={url}
        headers={headers}
      />
    ),
    UploadDropzone: <TEndpoint extends keyof TRouter>(
      props: Omit<
        ComponentProps<typeof UploadDropzone<TRouter, TEndpoint>>,
        "url" | "headers"
      >,
    ) => (
      <UploadDropzone<TRouter, TEndpoint>
        {...(props as any)}
        url={url}
        headers={headers}
      />
    ),
    Uploader: <TEndpoint extends keyof TRouter>(
      props: Omit<
        ComponentProps<typeof Uploader<TRouter, TEndpoint>>,
        "url" | "headers"
      >,
    ) => (
      <Uploader<TRouter, TEndpoint>
        {...(props as any)}
        url={url}
        headers={headers}
      />
    ),
  };
}

export { UploadButton, UploadDropzone };
