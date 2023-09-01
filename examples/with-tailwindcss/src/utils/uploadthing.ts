import { generateComponents } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react/hooks";

import type { OurFileRouter } from "~/server/uploadthing";

const url = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}/api/uploadthing`
  : `http://localhost:${process.env.PORT ?? 3000}/api/uploadthing`;

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>({ url });

export const { useUploadThing } = generateReactHelpers<OurFileRouter>({ url });
