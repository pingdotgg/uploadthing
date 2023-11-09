import { generateVueHelpers } from "@uploadthing/vue";
import type { UploadRouter } from "#uploadthing-router";

export const { useUploadThing } = generateVueHelpers<UploadRouter>();
