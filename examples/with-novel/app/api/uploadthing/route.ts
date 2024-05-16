import { uploadRouter } from "@/uploadthing/server";

import { createRouteHandler } from "uploadthing/next";

export const runtime = "edge";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    logLevel: "debug",
  },
});
