// This node import should be fine since it's available in both node and edge runtimes
// https://vercel.com/docs/functions/edge-functions/edge-runtime#compatible-node.js-modules
import type { NextApiRequest, NextApiResponse } from "next";

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
import { toWebRequest } from "./internal/to-web-request";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = {
  req: NextApiRequest;
  res: NextApiResponse;
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
    "nextjs-pages",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Return valid endpoints
    if (req.method === "GET") {
      const perms = getBuildPerms();
      res.status(200).json(perms);
      return;
    }

    const response = await runRequestHandlerAsync(
      requestHandler,
      {
        req: toWebRequest(req),
        middlewareArgs: { req, res, event: undefined },
      },
      opts.config,
    );

    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);

    if (response.success === false) {
      res.status(getStatusCodeFromError(response.error));
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      return res.json(formatError(response.error, opts.router));
    }

    return res.json(response.body);
  };
};

/**
 * @deprecated Use {@link createRouteHandler} instead
 */
export const createNextPageApiHandler = createRouteHandler;
