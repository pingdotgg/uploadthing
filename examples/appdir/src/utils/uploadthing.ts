import { generateComponents } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react/hooks";

import type { OurFileRouter } from "~/server/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>();

// UploadFiles works
export const { uploadFiles } = generateReactHelpers<OurFileRouter>();
// useUploadThing doesn't work
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
