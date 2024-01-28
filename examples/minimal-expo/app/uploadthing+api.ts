import { createRouteHandler, createUploadthing } from "uploadthing/server";
import type { FileRouter } from "uploadthing/server";

const f = createUploadthing();

const uploadRouter = {
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
      // if (!req.headers["x-some-header"]) {
      //   throw new Error("x-some-header is required");
      // }

      // Return some metadata to be stored with the file
      return { foo: "bar" as const };
    })
    .onUploadComplete(({ file, metadata }) => {
      metadata;
      // ^?
      console.log("upload completed", file);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});