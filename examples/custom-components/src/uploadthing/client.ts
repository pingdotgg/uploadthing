import { generateReactHelpers } from "@uploadthing/react";

import type { UploadRouter } from "~/uploadthing/server";

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<UploadRouter>();
