import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

export const runtime = "edge";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
