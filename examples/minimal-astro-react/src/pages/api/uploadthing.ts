import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "../../server/uploadthing";

export const { GET: get, POST: post } = createServerHandler({
  router: uploadRouter,
  config: {
    uploadthingId: import.meta.env.UPLOADTHING_APPID,
    uploadthingSecret: import.meta.env.UPLOADTHING_SECRET,
    callbackUrl: "http://localhost:3000/api/uploadthing",
  },
});
