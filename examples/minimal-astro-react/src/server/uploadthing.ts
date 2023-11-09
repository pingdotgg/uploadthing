import { createUploadthing } from "uploadthing/server";
import type { FileRouter } from "uploadthing/server";

const f = createUploadthing();

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
      req;
      return { foo: "bar" as const };
      //^?
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);

      // Return some data which will be available in `onClientUploadComplete`
      return { bar: "baz" as const };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
