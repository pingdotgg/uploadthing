import {
  createH3RouteHandler,
  createUploadthing,
  FileRouter,
} from "uploadthing/h3";

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
    .middleware(({ event }) => {
      console.log("event", event);
      event;
      // ^?
      return {};
    })
    .onUploadComplete((data) => {
      console.log("upload completed", data);
    }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;

export default eventHandler(createH3RouteHandler({ router: uploadRouter }));
