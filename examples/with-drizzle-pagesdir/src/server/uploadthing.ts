import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";

import { db } from "~/server/db";
import { files } from "./db/schema";

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
    video: {
      maxFileSize: "16MB",
    },
  })
    .middleware(({ req }) => {
      // Check some condition based on the incoming requrest
      // if (!req.headers.get("x-some-header")) {
      //   throw new Error("x-some-header is required");
      // }

      // Return some metadata to be stored with the file, e.g. who uploaded the file
      const userId = 1;
      return { uploaderId: userId };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      // Persist the file data to your database
      await db.insert(files).values({
        name: file.name,
        key: file.key,
        url: file.url,
        uploadedBy: metadata.uploaderId,
      });
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
