import { UploadThingError } from "@uploadthing/shared";

import type { FileRouter, inferErrorShape } from "./types";

export function defaultErrorFormatter(error: UploadThingError) {
  if (error.cause instanceof UploadThingError) {
    return {
      message: error.cause.message,
    };
  }
  return {
    message: error.message,
  };
}

export function formatError<TRouter extends FileRouter>(
  error: UploadThingError,
  router: TRouter,
): inferErrorShape<TRouter> {
  const errorFormatter =
    router[Object.keys(router)[0]]?._def.errorFormatter ??
    defaultErrorFormatter;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return errorFormatter(error);
}
