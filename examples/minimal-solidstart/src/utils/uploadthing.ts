import { generateComponents, generateSolidHelpers } from "@uploadthing/solid";

import type { OurFileRouter } from "~/server/uploadthing";

const url = "http://localhost:9898";

export const { UploadButton, UploadDropzone } =
  generateComponents<OurFileRouter>({ url });

export const { useUploadThing } = generateSolidHelpers<OurFileRouter>({ url });
