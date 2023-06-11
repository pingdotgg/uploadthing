import { generateSolidComponents } from "@uploadthing/solid";

import type { OurFileRouter } from "~/server/uploadthing";

const url = "http://localhost:9898";

export const { UploadButton, UploadDropzone, Uploader } =
  generateSolidComponents<OurFileRouter>(url);
