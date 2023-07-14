import type { FileRouter } from "uploadthing/server";

import UploadButton from "./UploadButton.svelte";
import UploadDropzone from "./UploadDropzone.svelte";
import Uploader from "./Uploader.svelte";

export { createUploader } from "./shared";
export { default as UploadButton } from "./UploadButton.svelte";
export { default as UploadDropzone } from "./UploadDropzone.svelte";
export { default as Uploader } from "./Uploader.svelte";

export function generateComponents<TRouter extends FileRouter>() {
  return {
    UploadButton: UploadButton<TRouter>,
    UploadDropzone: UploadDropzone<TRouter>,
    Uploader: Uploader<TRouter>,
  };
}
