import { generateComponents } from "@uploadthing/react";
import { generateReactHelpers } from "@uploadthing/react/hooks";
import { DANGEROUS__uploadFiles } from "uploadthing/client";
import { FileRouter } from "uploadthing/next";

import type { OurFileRouter } from "~/server/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } =
  generateComponents<OurFileRouter>();

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>();

const res = await uploadFiles("justimage", {
  files: [new File([""], "foo.png")],
});

res[0]!.serverdata;
//      ^?
