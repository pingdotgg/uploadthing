import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

const handler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: import.meta.env.UPLOADTHING_TOKEN,
  },
});
export { handler as GET, handler as POST };
