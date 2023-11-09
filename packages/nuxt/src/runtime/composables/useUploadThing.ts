import type { UploadRouter } from "#uploadthing-router";

import { generateVueHelpers } from "@uploadthing/vue";

export const { useUploadThing } = generateVueHelpers<UploadRouter>();
