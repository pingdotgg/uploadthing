import { generateComponents, generateUploadButton } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react/hooks";

import type { OurFileRouter } from "~/server/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>({
    url: "foo",
  });

export const Button = generateUploadButton<OurFileRouter>();

export const { useUploadThing } = generateReactHelpers<OurFileRouter>();
