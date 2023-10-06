import type { ComponentProps } from "react";

import { getFullApiUrl } from "uploadthing/client";
import type { ErrorMessage, FileRouter } from "uploadthing/server";

import { UploadButton } from "./components/button";
import { UploadDropzone } from "./components/dropzone";
import type { UploadthingComponentProps } from "./types";

export function Uploader<TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter>,
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
}) {
  const url =
    initOpts?.url instanceof URL ? initOpts.url : getFullApiUrl(initOpts?.url);

  return {
    UploadButton: (
      props: Omit<ComponentProps<typeof UploadButton<TRouter>>, "url">,
    ) => <UploadButton<TRouter> {...(props as any)} url={url} />,
    UploadDropzone: (
      props: Omit<ComponentProps<typeof UploadDropzone<TRouter>>, "url">,
    ) => <UploadDropzone<TRouter> {...(props as any)} url={url} />,
    Uploader: (
      props: Omit<ComponentProps<typeof Uploader<TRouter>>, "url">,
    ) => <Uploader<TRouter> {...(props as any)} url={url} />,
  };
}

export { UploadButton, UploadDropzone };
