import { uploadRouter } from "~/server/uploadthing";
import { createNextRouteHandler } from "uploadthing/next";

export const { GET, POST } = createNextRouteHandler({
  router: uploadRouter,
});
