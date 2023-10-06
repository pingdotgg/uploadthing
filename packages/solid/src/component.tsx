import type { ComponentProps } from "solid-js";

import { getFullUrl } from "uploadthing/client";
import type { ErrorMessage, FileRouter } from "uploadthing/server";

import { UploadButton } from "./components/button";
import { UploadDropzone } from "./components/dropzone";
import type { UploadthingComponentProps } from "./types";

export const Uploader = <TRouter extends FileRouter>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter>,
) => {
  const $props = props as UploadthingComponentProps<TRouter>;

  return (
    <>
      <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
        <span class="ut-text-center ut-text-4xl ut-font-bold">
          {`Upload a file using a button:`}
        </span>
        {/* @ts-expect-error - we know this is valid from the check above */}
        <UploadButton<TRouter> {...$props} />
      </div>
      <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
        <span class="ut-text-center ut-text-4xl ut-font-bold">
          {`...or using a dropzone:`}
        </span>
        {/* @ts-expect-error - we know this is valid from the check above */}
        <UploadDropzone<TRouter> {...$props} />
      </div>
    </>
  );
};

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
  url?: string;
}) {
  const url = getFullUrl(initOpts?.url);

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
