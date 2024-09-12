import { createRouteHandler, createUploadthing } from "uploadthing/remix";
import { FileRouter } from "uploadthing/types";

// import { getAuth } from '@clerk/remix/ssr.server'

const f = createUploadthing();

export const uploadRouter = {
  videoAndImage: f({
    image: { maxFileSize: "4MB" },
    video: { maxFileSize: "16MB" },
  })
    .middleware(async ({ event }) => {
      // You should perform authentication here
      // const { sessionId } = await getAuth(event);

      return { userId: "123" };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const { loader, action } = createRouteHandler({ router: uploadRouter });
