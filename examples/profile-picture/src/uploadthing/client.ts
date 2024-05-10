import { generateReactHelpers, generateUploadButton } from "@uploadthing/react";

import type { UploadRouter } from "./server";

export const UploadButton = generateUploadButton<UploadRouter>();

export const { useUploadThing } = generateReactHelpers<UploadRouter>();
