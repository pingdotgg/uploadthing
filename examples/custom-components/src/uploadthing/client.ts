import {
  generateReactHelpers,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { UploadRouter } from "~/uploadthing/server";

export const UploadDropzone = generateUploadDropzone<UploadRouter>();
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>();
