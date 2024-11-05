import type { UploadThingError } from "@uploadthing/shared";

import type { FileRouter, inferErrorShape } from "../types";

export function defaultErrorFormatter(error: UploadThingError) {
  return {
    message: error.message,
  };
}

export function formatError(
  error: UploadThingError,
  router: FileRouter,
): inferErrorShape<FileRouter[string]> {
  const errorFormatter =
    router[Object.keys(router)[0]]?.errorFormatter ?? defaultErrorFormatter;

  return errorFormatter(error);
}
