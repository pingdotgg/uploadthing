import {
  generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
  type GenerateTypedHelpersOptions,
} from "@uploadthing/react";

import type { OurFileRouter } from "../../server/src/router";
import { BACKEND_URL } from "./constants";

const initOpts = {
  url: BACKEND_URL,
} satisfies GenerateTypedHelpersOptions;

export const UploadButton = generateUploadButton<OurFileRouter>(initOpts);
export const UploadDropzone = generateUploadDropzone<OurFileRouter>(initOpts);

export const { useUploadThing } = generateReactHelpers<OurFileRouter>(initOpts);
