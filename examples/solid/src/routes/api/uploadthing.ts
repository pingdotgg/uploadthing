import { createServerHandler } from "@uploadthing/solid";

import { uploadRouter } from "~/server/uploadthing";

export const { GET, POST } = createServerHandler({
  router: uploadRouter,
  config: {
    callbackUrl: `http://localhost:${process.env.PORT ?? 9898}/api/uploadthing`,
  },
});
