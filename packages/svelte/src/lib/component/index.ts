export { createUploader } from "./shared";
export { default as UploadButton } from "./UploadButton.svelte";
export { default as UploadDropzone } from "./UploadDropzone.svelte";
export { default as Uploader } from "./Uploader.svelte";

// Removing this for now, I don't think it is actually useful with how this package works
// export function generateComponents<TRouter extends FileRouter>() {
//   return {
//     UploadButton: UploadButton<TRouter>,
//     UploadDropzone: UploadDropzone<TRouter>,
//     Uploader: Uploader<TRouter>,
//   };
// }
