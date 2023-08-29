import type { APIRoute } from "astro";

import { createServerHandler } from "uploadthing/server";

import { uploadRouter } from "../../uploadthing";

const handlers = createServerHandler({
  router: uploadRouter,
  config: {
    uploadthingId: import.meta.env.UPLOADTHING_APPID,
    uploadthingSecret: import.meta.env.UPLOADTHING_SECRET,
    callbackUrl: "http://localhost:3000/api/uploadthing",
  },
});

export const get: APIRoute = async ({ request }) => {
  const response = await handlers.GET({ request });
  return response;
};

export const post: APIRoute = async ({ request }) => {
  const response = await handlers.POST({ request });
  return response;
};
