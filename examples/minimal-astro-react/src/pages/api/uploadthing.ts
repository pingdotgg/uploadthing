import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

/**
 * This example uses the hybrid mode so we must opt-in to dynamic rendering
 * https://docs.astro.build/en/guides/endpoints/#server-endpoints-api-routes
 **/
export const prerender = false;

export const ALL = createRouteHandler({
  router: uploadRouter,
  config: {
    token: import.meta.env.UPLOADTHING_TOKEN,
    logLevel: "Debug",
  },
});
