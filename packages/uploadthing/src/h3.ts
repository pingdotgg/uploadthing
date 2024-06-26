import type { H3Event } from "h3";
import {
  assertMethod,
  defineEventHandler,
  setHeader,
  setResponseStatus,
  toWebRequest,
} from "h3";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./internal/config";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
  runRequestHandlerAsync,
} from "./internal/handler";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = { req: undefined; res: undefined; event: H3Event };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    "h3",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return defineEventHandler(async (event) => {
    assertMethod(event, ["GET", "POST"]);
    setHeader(event, "x-uploadthing-version", UPLOADTHING_VERSION);

    // GET
    if (event.method === "GET") {
      return getBuildPerms();
    }

    // POST
    const response = await runRequestHandlerAsync(
      requestHandler,
      {
        req: toWebRequest(event),
        middlewareArgs: { req: undefined, res: undefined, event },
      },
      opts.config,
    );

    if (response.success === false) {
      setResponseStatus(event, getStatusCodeFromError(response.error));
      return formatError(response.error, opts.router);
    }

    return response.body ?? { ok: true };
  });
};

/**
 * @deprecated Use {@link createRouteHandler} instead
 */
export const createH3EventHandler = createRouteHandler;
