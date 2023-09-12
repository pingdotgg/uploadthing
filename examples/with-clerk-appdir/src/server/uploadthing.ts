import { auth } from "@clerk/nextjs";

import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";

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
      const { userId } = auth();

      if (!userId) {
        throw new Error("Please sign in");
      }

      return { userId };
    })
    .onUploadComplete(({ file, metadata }) => {
      metadata;
      // ^?
      console.log("upload completed", file);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
