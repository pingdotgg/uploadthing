import { generateVueHelpers } from "@uploadthing/vue";
import { FileRouter } from "uploadthing/h3";

// FIXME: This should use the user's UploadRouter type
export const { useUploadThing } = generateVueHelpers<FileRouter>();
