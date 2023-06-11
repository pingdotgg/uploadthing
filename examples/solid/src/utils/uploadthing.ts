import { generateSolidComponents } from "@uploadthing/solid";

import type { OurFileRouter } from "~/server/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } =
  generateSolidComponents<OurFileRouter>();
