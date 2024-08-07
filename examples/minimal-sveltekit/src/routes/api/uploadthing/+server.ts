import { env } from "$env/dynamic/private";
import { uploadRouter } from "$lib/server/uploadthing";

import { createRouteHandler } from "uploadthing/server";

// The Svelte extension complains if you export the handlers directly
const handler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: env.UPLOADTHING_TOKEN,
  },
});

export { handler as GET, handler as POST };
