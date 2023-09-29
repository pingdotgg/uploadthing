import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

export const { GET, POST } = createServerHandler({
  router: uploadRouter,
  config: {
    callbackUrl: `http://localhost:${
      import.meta.env.VITE_PORT ?? 9898
    }/api/uploadthing`,
  },
});
