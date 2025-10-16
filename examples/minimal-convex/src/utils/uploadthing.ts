import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "~/convex/uploadthing";

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
});
export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
});

export const { useUploadThing } = generateReactHelpers<OurFileRouter>({
  url: process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
});
