import { createNextPageApiHandler } from "uploadthing/next-legacy";

import { uploadRouter } from "~/server/uploadthing";

const handler = createNextPageApiHandler({
  router: uploadRouter,
});

export default handler;
