import { createH3RouteHandler } from "uploadthing/h3";
import { createUploadthing, FileRouter } from "uploadthing/server";

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
    .middleware(({ req, res }) => {
      console.log("req,res", req, res);
      return {};
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export default eventHandler(createH3RouteHandler({ router: uploadRouter }));
