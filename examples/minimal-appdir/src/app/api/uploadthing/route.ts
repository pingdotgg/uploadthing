import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    logLevel: "debug",
    // handleDaemonPromise: "await",
  },
});
