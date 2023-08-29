import type { APIRoute } from "astro";

import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "../../server/uploadthing";

const handlers = createServerHandler({
  router: uploadRouter,
  config: {
    uploadthingId: import.meta.env.UPLOADTHING_APPID,
    uploadthingSecret: import.meta.env.UPLOADTHING_SECRET,
    callbackUrl: "http://localhost:3000/api/uploadthing",
  },
});

export const get: APIRoute = async ({ request }) => handlers.GET({ request });
export const post: APIRoute = async ({ request }) => handlers.POST({ request });
