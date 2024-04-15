import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";

import type { UploadRouter } from "~/uploadthing/server";

export const UploadButton = generateUploadButton<UploadRouter>();
export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>();
