import type { H3Event } from "h3";
import {
  createRouter,
  defineEventHandler,
  getRequestHeaders,
  getRequestURL,
  readBody,
  setHeaders,
  setResponseStatus,
} from "h3";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { defaultErrorFormatter } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import type { RouterWithConfig } from "./internal/handler";
import type { FileRouter } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<
    { req: undefined; res: undefined; event: H3Event },
    TErrorShape
  >(opts);

export const createH3EventHandler = <TRouter extends FileRouter>(
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
      event,
    });

    setHeaders(event, { "x-uploadthing-version": UPLOADTHING_VERSION });

    if (response instanceof UploadThingError) {
      setResponseStatus(event, getStatusCodeFromError(response));
      const errorFormatter =
        opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter ??
        defaultErrorFormatter;
      return errorFormatter(response) as unknown;
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      setResponseStatus(event, 500);
      return "An unknown error occurred";
    }

    setResponseStatus(event, 200);
    return response.body;
  });

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);
  const GET = defineEventHandler((event) => {
    setResponseStatus(event, 200);
    setHeaders(event, { "x-uploadthing-version": UPLOADTHING_VERSION });
    return getBuildPerms();
  });

  const router = createRouter()
    .post("/api/uploadthing", POST)
    .get("/api/uploadthing", GET);
  return router.handler;
};
