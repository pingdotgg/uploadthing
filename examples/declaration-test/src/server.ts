import { z } from "zod";

import { createNextRouteHandler } from "uploadthing/next";
import {
  createServerHandler,
  createUploadthing,
  UTApi,
} from "uploadthing/server";

const f = createUploadthing({
  /**
   * Log out more information about the error, but don't return it to the client
   * @see https://docs.uploadthing.com/errors#error-formatting
   */
  errorFormatter: (err) => {
    console.log("Error uploading file", err.message);
    console.log("  - Above error caused by:", err.cause);

    return { message: err.message };
  },
});

export const router = {
  foo: f({ image: {} })
    .input(z.object({ foo: z.string() }))
    .middleware(({ input, req }) => {
      input;
      // ^?
      req;
      // ^?

      return { foo: "bar" as const };
    })
    .onUploadError(({ error }) => {
      error;
      // ^?
    })
    .onUploadComplete(({ file, metadata }) => {
      file;
      // ^?
      metadata;
      // ^?
    }),
};
export type Router = typeof router;

export const handlers = createNextRouteHandler({ router });
export const handlers2 = createServerHandler({ router });

export const utapi = new UTApi({ apiKey: "foo" });
