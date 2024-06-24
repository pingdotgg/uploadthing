import { generateReactNativeHelpers } from "@uploadthing/expo";

import { UploadRouter } from "~/app/api/uploadthing+api";

export const { useImageUploader, useDocumentUploader } =
  generateReactNativeHelpers<UploadRouter>();
