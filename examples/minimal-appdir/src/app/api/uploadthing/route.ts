import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/server/uploadthing";

// Edge works in prod, but our webhook doesn't due to request-loop-protection
// export const runtime = "edge";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    logLevel: "debug",
  },
});
