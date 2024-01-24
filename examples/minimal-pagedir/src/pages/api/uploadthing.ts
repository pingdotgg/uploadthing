import { createRouteHandler } from "uploadthing/next-legacy";

import { uploadRouter } from "~/server/uploadthing";

const handler = createRouteHandler({
  router: uploadRouter,
});

export default handler;
