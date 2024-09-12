import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";

import { UploadRouter } from "../routes/api.uploadthing";

export const { useUploadThing } = generateReactHelpers<UploadRouter>();
export const UploadButton = generateUploadButton<UploadRouter>();
