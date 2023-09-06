import { generateComponents, generateSolidHelpers } from "@uploadthing/solid";

import type { OurFileRouter } from "~/server/uploadthing";

const url = import.meta.env.VITE_VERCEL_URL
  ? `https://${import.meta.env.VITE_VERCEL_URL}/api/uploadthing`
  : `http://localhost:${import.meta.env.VITE_PORT ?? 9898}/api/uploadthing`;

export const { UploadButton, UploadDropzone } =
  generateComponents<OurFileRouter>({ url });

export const { useUploadThing } = generateSolidHelpers<OurFileRouter>({ url });
