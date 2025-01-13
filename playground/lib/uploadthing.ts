import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadPrimitives,
} from "@uploadthing/react";

import { UploadRouter } from "../app/api/uploadthing/route";

export const UT = generateUploadPrimitives<UploadRouter>();
export const UTButton = generateUploadButton<UploadRouter>();
export const { useUploadThing } = generateReactHelpers<UploadRouter>();
