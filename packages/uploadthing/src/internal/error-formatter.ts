import type { UploadThingError } from "@uploadthing/shared";

export function defaultErrorFormatter(error: UploadThingError) {
  return {
    message: error.message,
  };
}
