import type { Handle } from "@sveltejs/kit";

import { createServerHandler } from "uploadthing/server";
import type { FileRouter, RouterWithConfig } from "uploadthing/server";

export const createUploadthingHandle = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
): Handle => {
  const { GET, POST } = createServerHandler(opts);
  return ({ event, resolve }) => {
    const { request, url } = event;
    if (url.pathname.startsWith("/api/uploadthing")) {
      if (request.method === "POST") {
        return POST(request);
      }
      if (request.method === "GET") {
        return GET(request);
      }
    }
    return resolve(event);
  };
};
