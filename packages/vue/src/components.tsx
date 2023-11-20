import { defineComponent } from "vue";

import type { FileRouter } from "uploadthing/server";

import { UploadButton } from "./components/button";
import { UploadDropzone } from "./components/dropzone";
import { Spinner } from "./components/shared";
import type { UploadthingComponentProps } from "./types";

export { UploadButton, UploadDropzone, Spinner };

export const Uploader = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
>() =>
  defineComponent(
    (_props: { config: UploadthingComponentProps<TRouter, TEndpoint> }) => {
      return () => {
        return (
          <>
            <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
              <span class="ut-text-center ut-text-4xl ut-font-bold">
                {`Upload a file using a button:`}
              </span>
              {/* @ts-expect-error - this is validated above */}
              <UploadButton<TRouter> {...props} />
            </div>
            <div class="ut-flex ut-flex-col ut-items-center ut-justify-center ut-gap-4">
              <span class="ut-text-center ut-text-4xl ut-font-bold">
                {`...or using a dropzone:`}
              </span>
              {/* @ts-expect-error - this is validated above */}
              <UploadDropzone<TRouter> {...props} />
            </div>
          </>
        );
      };
    },
    {
      props: ["config"],
    },
  );

// builder function to create generic component inside of SFC setup script
export const useUploadButton = <TRouter extends FileRouter>() => {
  // @ts-expect-error - FIXME: need TEndpoint somehow
  return UploadButton<TRouter>();
};

export const useUploadDropzone = <TRouter extends FileRouter>() => {
  // @ts-expect-error - FIXME: need TEndpoint somehow
  return UploadDropzone<TRouter>();
};

export const useUploader = <TRouter extends FileRouter>() => {
  // @ts-expect-error - FIXME: need TEndpoint somehow
  return Uploader<TRouter>();
};
