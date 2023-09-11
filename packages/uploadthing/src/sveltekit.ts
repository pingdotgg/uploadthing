import type { Handle } from "@sveltejs/kit";

import type { Json } from "@uploadthing/shared";

import type { RouterWithConfig } from "./internal/handler";
import type { FileRouter } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import { createNextRouteHandler } from "./next";

export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"app", TErrorShape>(opts);

export const createUploadthingHandle = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
): Handle => {
  const { GET, POST } = createNextRouteHandler(opts);
  return ({ event, resolve }) => {
    const { request, url } = event;
    if (url.pathname.startsWith("/api/uploadthing")) {
      if (request.method === "POST") {
        return POST(request);
      }
      if (request.method === "GET") {
        return GET();
      }
    }
    return resolve(event);
  };
};
