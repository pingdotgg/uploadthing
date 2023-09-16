import { createH3RouteHandler } from "uploadthing/h3";
import { createUploadthing, FileRouter } from "uploadthing/server";

const f = createUploadthing();

const uploadRouter = {
  image: f(["image"])
    .middleware(({ req, res }) => {
      console.log("req,res", req, res);
      return {};
    })
    .onUploadComplete(() => {}),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export default eventHandler(createH3RouteHandler({ router: uploadRouter }));
