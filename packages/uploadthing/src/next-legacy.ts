// This node import should be fine since it's available in both node and edge runtimes
// https://vercel.com/docs/functions/edge-functions/edge-runtime#compatible-node.js-modules
import type { NextApiRequest, NextApiResponse } from "next";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";
import type { Json } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { formatError } from "./internal/error-formatter";
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
    { req: NextApiRequest; res: NextApiResponse; event: undefined },
    TErrorShape
  >(opts);

export const createNextPageApiHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  initLogger(opts.config?.logLevel);
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter>(opts);
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Return valid endpoints
    if (req.method === "GET") {
      const perms = getBuildPerms();
      res.status(200).json(perms);
      return;
    }

    const proto = (req.headers["x-forwarded-proto"] as string) ?? "http";
    const url = new URL(req.url ?? "/", `${proto}://${req.headers.host}`);

    const response = await requestHandler({
      req: new Request(url, {
        method: req.method,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: req.headers as any,
        body:
          typeof req.body === "string" ? req.body : JSON.stringify(req.body),
      }),
      url,
      res,
    });

    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);

    if (response instanceof UploadThingError) {
      res.status(getStatusCodeFromError(response));
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      return res.json(formatError(response, opts.router));
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      res.status(500);
      return res.send("An unknown error occured");
    }

    res.status(response.status);
    return res.json(response.body);
  };
};
