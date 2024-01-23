import { createNextPageApiHandler } from "uploadthing/next-legacy";

import { uploadRouter } from "~/server/uploadthing";

const handler = createNextPageApiHandler({
  router: uploadRouter,
  config: {
    logLevel: "debug",
  },
});

export default handler;
