import {
  createRouter,
  defineEventHandler,
  getRequestHeaders,
  getRequestURL,
  readBody,
  setHeaders,
  setResponseStatus,
} from "h3";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { defaultErrorFormatter } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import type { RouterWithConfig } from "./internal/handler";
import type { FileRouter } from "./internal/types";

export const createH3RouteHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const requestHandler = buildRequestHandler(opts);
  const POST = defineEventHandler(async (event) => {
    const response = await requestHandler({
      req: {
        url: getRequestURL(event).href,
        headers: getRequestHeaders(event),
        json: () => Promise.resolve(readBody(event)),
      },
      //   res: event.node.res, // <-- DO WE NEED THIS?
    });

    setHeaders(event, { "x-uploadthing-version": UPLOADTHING_VERSION });

    if (response instanceof UploadThingError) {
      setResponseStatus(event, getStatusCodeFromError(response));
      const errorFormatter =
        opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter ??
        defaultErrorFormatter;
      return JSON.stringify(errorFormatter(response));
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      setResponseStatus(event, 500);
      return "An unknown error occurred";
    }

    setResponseStatus(event, 200);
    return JSON.stringify(response);
  });

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);
  const GET = defineEventHandler((event) => {
    setResponseStatus(event, 200);
    setHeaders(event, { "x-uploadthing-version": UPLOADTHING_VERSION });
    return JSON.stringify(getBuildPerms());
  });

  const router = createRouter()
    .post("/api/uploadthing", POST)
    .get("/api/uploadthing", GET);
  return router.handler;
};
