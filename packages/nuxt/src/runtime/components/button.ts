import type { UploadRouter } from "#uploadthing-router";

import { generateUploadButton } from "@uploadthing/vue";

const UploadButton = generateUploadButton<UploadRouter>();

export default UploadButton;
