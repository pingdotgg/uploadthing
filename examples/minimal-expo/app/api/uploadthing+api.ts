import { isObject } from "@trpc/server/unstable-core-do-not-import";
import { z } from "zod";

import { createRouteHandler, createUploadthing } from "uploadthing/server";
import type { FileRouter } from "uploadthing/server";

const f = createUploadthing({
  /**
   * Log out more information about the error, but don't return it to the client
   * @see https://docs.uploadthing.com/errors#error-formatting
   */
  errorFormatter: (err) => {
    console.log("Error uploading file", err.message);
    console.log("  - Above error caused by:", err.cause);

    return {
      message: err.message,
      reason:
        isObject(err.cause) && typeof err.cause.error === "string"
          ? err.cause.error
          : null,
    };
  },
});

/**
 * This is your Uploadthing file router. For more information:
 * @see https://docs.uploadthing.com/api-reference/server#file-routes
 */
export const uploadRouter = {
  videoAndImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
  }).onUploadComplete((data) => {
    console.log("upload completed", data);
  }),
  document: f({
    pdf: {
      maxFileSize: "64MB",
      maxFileCount: 1,
      contentDisposition: "inline",
    },
  })
    .input(z.object({ foo: z.string() }))
    .middleware(({ input }) => {
      return { input };
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: { logLevel: "debug" },
});
