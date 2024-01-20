import type { H3Event } from "h3";
import {
  assertMethod,
  defineEventHandler,
  setHeader,
  setResponseStatus,
  toWebRequest,
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
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import { initLogger } from "./internal/logger";
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
  initLogger(opts.config?.logLevel);
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler(opts);
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return defineEventHandler(async (event) => {
    assertMethod(event, ["GET", "POST"]);
    setHeader(event, "x-uploadthing-version", UPLOADTHING_VERSION);

    // GET
    if (event.method === "GET") {
      return getBuildPerms();
    }

    // POST
    const response = await requestHandler({
      req: toWebRequest(event),
      event,
    });

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

    return response.body;
  });
};
