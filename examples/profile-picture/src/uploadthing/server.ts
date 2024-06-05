import { auth } from "@/auth";
import { db } from "@/db/client";
import { User } from "@/db/schema";
import { eq } from "drizzle-orm";

import { createUploadthing } from "uploadthing/next";
import type { FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

const utapi = new UTApi();

const f = createUploadthing();
/**
 * This is your Uploadthing file router. For more information:
 * @see https://docs.uploadthing.com/api-reference/server#file-routes
 */

export const uploadRouter = {
  profilePicture: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
      additionalProperties: {
        width: 200,
        aspectRatio: 1,
      },
    },
  })
    .middleware(async () => {
      const user = (await auth())?.user;
      if (!user) throw new UploadThingError("Unauthorized");

      const currentImageKey = user.image?.split("/f/")[1];

      return { userId: user.id, currentImageKey };
    })
    .onUploadComplete(async ({ file, metadata }) => {
      /**
       * Update the user's image in the database
       */
      await db
        .update(User)
        .set({ image: file.url })
        .where(eq(User.id, metadata.userId));

      /**
       * Delete the old image if it exists
       */
      if (metadata.currentImageKey) {
        await utapi.deleteFiles(metadata.currentImageKey);
      }
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;
