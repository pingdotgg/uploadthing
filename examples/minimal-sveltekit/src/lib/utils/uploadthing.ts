import { generateSvelteHelpers } from "@uploadthing/svelte";

import type { OurFileRouter } from "../server/uploadthing";

export const { createUploadThing, createUploader } =
  generateSvelteHelpers<OurFileRouter>();
