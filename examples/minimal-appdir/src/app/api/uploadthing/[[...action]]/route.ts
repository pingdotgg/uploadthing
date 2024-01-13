import { createNextRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

export const runtime = "edge";

export const { GET, POST } = createNextRouteHandler({
  router: uploadRouter,
  config: {
    logLevel: "debug",
  },
});
