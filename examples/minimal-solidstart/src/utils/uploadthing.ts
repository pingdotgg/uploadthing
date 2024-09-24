import {
  generateSolidHelpers,
  generateUploadButton,
  generateUploadDropzone,
  generateUploader,
} from "@uploadthing/solid";

import { UploadRouter } from "~/server/uploadthing";

const initOpts = {
  /**
   * Set absolute URL to have SSR working properly
   */
  url: "http://localhost:3000",
};

export const UploadButton = generateUploadButton<UploadRouter>(initOpts);
export const UploadDropzone = generateUploadDropzone<UploadRouter>(initOpts);
export const Uploader = generateUploader<UploadRouter>(initOpts);
export const { createUploadThing } =
  generateSolidHelpers<UploadRouter>(initOpts);
