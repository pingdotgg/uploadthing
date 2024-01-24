import {
  generateSolidHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/solid";

import type { OurFileRouter } from "~/server/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

export const { useUploadThing } = generateSolidHelpers<OurFileRouter>();
