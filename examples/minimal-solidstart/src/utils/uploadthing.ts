import { generateComponents, generateSolidHelpers } from "@uploadthing/solid";

import type { OurFileRouter } from "~/server/uploadthing";

export const { UploadButton, UploadDropzone } =
  generateComponents<OurFileRouter>({
    url: "http://localhost:9898/api/uploadthing",
  });

export const { useUploadThing } = generateSolidHelpers<OurFileRouter>();
