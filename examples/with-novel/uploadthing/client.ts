import { generateReactHelpers } from "@uploadthing/react";

import type { UploadRouter } from "./server";

export const { uploadFiles, getRouteConfig } =
  generateReactHelpers<UploadRouter>();
