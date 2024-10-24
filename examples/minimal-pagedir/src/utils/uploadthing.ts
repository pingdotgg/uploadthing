import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
  generateUploadPrimitives,
} from "@uploadthing/react";

import type { OurFileRouter } from "~/server/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
export const UT = generateUploadPrimitives<OurFileRouter>();

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
