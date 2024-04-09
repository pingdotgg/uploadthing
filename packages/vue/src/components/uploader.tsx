import { defineComponent } from "vue";

import type { FileRouter } from "uploadthing/server";

import type { UploadthingComponentProps } from "../types";
import { UploadButton } from "./button";
import { UploadDropzone } from "./dropzone";

export const Uploader = <
  TRouter extends FileRouter,
  TEndpoint extends keyof TRouter,
  TSkipPolling extends boolean = false,
>() =>
  defineComponent(
    (_props: {
      config: UploadthingComponentProps<TRouter, TEndpoint, TSkipPolling>;
    }) => {
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
