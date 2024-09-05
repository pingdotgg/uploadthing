import { createRouteHandler } from "uploadthing/next";

import { uploadRouter } from "~/uploadthing/server";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: uploadRouter,

  // Apply an (optional) custom config:
  // config: { ... },
});
