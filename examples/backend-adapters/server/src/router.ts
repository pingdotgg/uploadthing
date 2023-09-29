import { createUploadthing, type FileRouter } from "uploadthing/server";

/**
 * Any Request / Response based framework can use the /server module.
 * You'll get a typed `Request` in your middleware function.
 */
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
      //^?
      return {}
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;
