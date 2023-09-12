import { createNextRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

export const { GET, POST } = createNextRouteHandler({
  router: uploadRouter,
});
