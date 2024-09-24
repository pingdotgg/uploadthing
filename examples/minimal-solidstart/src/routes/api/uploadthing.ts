import type { APIEvent } from "@solidjs/start/server";

import { createRouteHandler } from "uploadthing/server";

import { uploadRouter } from "~/server/uploadthing";

const handler = createRouteHandler({
  router: uploadRouter,
});

export const GET = (event: APIEvent) => handler(event.request);
export const POST = (event: APIEvent) => handler(event.request);
