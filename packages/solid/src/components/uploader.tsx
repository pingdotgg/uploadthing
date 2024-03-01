import type { ErrorMessage, FileRouter } from "uploadthing/server";

import type { UploadthingComponentProps } from "../types";

export const Uploader = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
>(
  props: FileRouter extends TRouter
    ? ErrorMessage<"You forgot to pass the generic">
    : UploadthingComponentProps<TRouter, TEndpoint, TSkipPolling>,
) => {
  const $props = props as UploadthingComponentProps<
    TRouter,
    TEndpoint,
    TSkipPolling
  >;

  return (
    <>
      <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
        <span class="ut-text-center ut-text-4xl ut-font-bold">
          {`Upload a file using a button:`}
        </span>
        {/* @ts-expect-error - we know this is valid from the check above */}
        <UploadButton<TRouter, TEndpoint> {...$props} />
      </div>
      <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
        <span class="ut-text-center ut-text-4xl ut-font-bold">
          {`...or using a dropzone:`}
        </span>
        {/* @ts-expect-error - we know this is valid from the check above */}
        <UploadDropzone<TRouter, TEndpoint> {...$props} />
      </div>
    </>
  );
};
