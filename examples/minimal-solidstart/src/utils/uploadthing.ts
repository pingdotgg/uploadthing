import {
  generateSolidHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/solid";

import { OurFileRouter } from "~/server/uploadthing";

const initOpts = {
  /**
   * Set absolute URL to have SSR working properly
   */
  url: "http://localhost:3000",
};

export const UploadButton = generateUploadButton<OurFileRouter>(initOpts);
export const UploadDropzone = generateUploadDropzone<OurFileRouter>(initOpts);
export const { useUploadThing } = generateSolidHelpers<OurFileRouter>(initOpts);
