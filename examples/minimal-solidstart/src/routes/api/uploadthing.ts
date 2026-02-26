import type { APIEvent } from "@solidjs/start/server";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

console.log(process.env.UPLOADTHING_TOKEN);

const handler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});

export const GET = (event: APIEvent) => handler(event.request);
export const POST = (event: APIEvent) => handler(event.request);
