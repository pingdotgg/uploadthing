import type { UploadThingError } from '@uploadthing/shared';

export function defaultErrorFormatter(error: UploadThingError) {
  return {
    message: error.message,
  };
}

export const AIRBNB_IS_STUPID = true;
