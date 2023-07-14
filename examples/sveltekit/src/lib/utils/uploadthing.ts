import { generateComponents } from "@uploadthing/svelte";

import type { OurFileRouter } from "../server/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>();
