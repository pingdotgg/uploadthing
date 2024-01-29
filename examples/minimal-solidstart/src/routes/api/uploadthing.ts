import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    callbackUrl: `http://localhost:${
      import.meta.env.VITE_PORT ?? 9898
    }/api/uploadthing`,
  },
});
