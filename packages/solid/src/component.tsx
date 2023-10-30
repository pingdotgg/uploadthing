import type { ErrorMessage, FileRouter } from "uploadthing/server";

import type { UploadButtonProps } from "./components/button";
import { UploadButton } from "./components/button";
import type { UploadDropzoneProps } from "./components/dropzone";
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

export function generateComponents<TRouter extends FileRouter>(url?: string) {
  return {
    UploadButton: (props: UploadButtonProps<TRouter>) => (
      <UploadButton<TRouter> {...(props as any)} url={props.url ?? url} />
    ),
    UploadDropzone: (props: UploadDropzoneProps<TRouter>) => (
      <UploadDropzone<TRouter> {...(props as any)} url={props.url ?? url} />
    ),
    Uploader: (props: UploadthingComponentProps<TRouter>) => (
      <Uploader<TRouter> {...(props as any)} url={props.url ?? url} />
    ),
  };
}

export { UploadButton, UploadDropzone };
