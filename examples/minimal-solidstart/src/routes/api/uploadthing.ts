import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
});
