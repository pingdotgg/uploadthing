import { generateComponents, generateSolidHelpers } from "@uploadthing/solid";

import type { OurFileRouter } from "~/server/uploadthing";

export const { UploadButton, UploadDropzone } =
  generateComponents<OurFileRouter>("http://localhost:9898");

export const { useUploadThing } = generateSolidHelpers<OurFileRouter>();
