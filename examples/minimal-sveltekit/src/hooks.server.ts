import type { Handle } from "@sveltejs/kit";
import { uploadRouter } from "$lib/server/uploadthing";

import { createServerHandler } from "uploadthing/server";

const utHandlers = createServerHandler({
  router: uploadRouter,
});

export const handle: Handle = ({ event, resolve }) => {
  if (event.url.pathname.startsWith("/api/uploadthing")) {
    if (event.request.method === "POST") {
      return utHandlers.POST(event);
    }
    if (event.request.method === "GET") {
      return utHandlers.GET(event);
    }
  }
  return resolve(event);
};
