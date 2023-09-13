import { revalidateTag } from "next/cache";

import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";

import { db } from "~/server/db";
import { files } from "./db/schema";

const f = createUploadthing();
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
      req;
      //^?
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

      // Revalidate the route that can be used for polling
      revalidateTag(`/api/file/${file.key}`);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
