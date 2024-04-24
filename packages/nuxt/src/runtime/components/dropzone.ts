import type { UploadRouter } from "#uploadthing-router";

import { generateUploadDropzone } from "@uploadthing/vue";

const UploadDropzone = generateUploadDropzone<UploadRouter>();

export default UploadDropzone;
