import { generateSvelteHelpers } from "@uploadthing/svelte";

import type { OurFileRouter } from "../server/uploadthing";

export const { useUploadThing, createUploader } =
  generateSvelteHelpers<OurFileRouter>();
