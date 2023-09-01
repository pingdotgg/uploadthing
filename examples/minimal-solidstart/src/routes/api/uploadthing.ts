import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

export const { GET, POST } = createServerHandler({
  router: uploadRouter,
});
