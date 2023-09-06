import type { ComponentProps } from "react";

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

export function generateComponents<TRouter extends FileRouter>(initOpts: {
  /**
   * Absolute URL to the UploadThing API endpoint
   * @example http://localhost:3000/api/uploadthing
   * @example https://www.example.com/api/uploadthing
   */
  url: string;
}) {
  return {
    UploadButton: (
      props: Omit<ComponentProps<typeof UploadButton<TRouter>>, "url">,
    ) => <UploadButton<TRouter> {...(props as any)} url={initOpts.url} />,
    UploadDropzone: (
      props: Omit<ComponentProps<typeof UploadDropzone<TRouter>>, "url">,
    ) => <UploadDropzone<TRouter> {...(props as any)} url={initOpts.url} />,
    Uploader: (
      props: Omit<ComponentProps<typeof Uploader<TRouter>>, "url">,
    ) => <Uploader<TRouter> {...(props as any)} url={initOpts.url} />,
  };
}

export { UploadButton, UploadDropzone };
