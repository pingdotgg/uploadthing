import type { UploadThingError } from "../shared";

export function defaultErrorFormatter(error: UploadThingError) {
  return {
    message: error.message,
  };
}
