import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "../../server/uploadthing";

export const { GET, POST } = createRouteHandler({
  router: uploadRouter,
  config: {
    uploadthingId: import.meta.env.UPLOADTHING_APPID,
    uploadthingSecret: import.meta.env.UPLOADTHING_SECRET,
    callbackUrl: "http://localhost:4321/api/uploadthing",
  },
});
