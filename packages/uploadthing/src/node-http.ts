import type { IncomingMessage, ServerResponse } from "node:http";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./internal/constants";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
  runRequestHandlerAsync,
} from "./internal/handler";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import { getPostBody, toWebRequest } from "./internal/to-web-request";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = {
  req: IncomingMessage;
  res: ServerResponse;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    "node-http",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return async (req: IncomingMessage, res: ServerResponse) => {
    switch (req.method) {
      case "GET": {
        const response = getBuildPerms();
        res.statusCode = 200;
        res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(response));
        return;
      }
      case "POST": {
        const response = await runRequestHandlerAsync(
          requestHandler,
          {
            req: getPostBody({ req }).pipe(
              Effect.andThen((body) => toWebRequest(req, body)),
            ),
            middlewareArgs: { req, res, event: undefined },
          },
          opts.config,
        );
        if (response.success === false) {
          res.statusCode = getStatusCodeFromError(response.error);
          res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify(formatError(response.error, opts.router)));
          return;
        }
        res.statusCode = 200;
        res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify(response.body));
        return;
      }
      default: {
        res.statusCode = 405;
        res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "Method not allowed" }));
        return;
      }
    }
  };
};
