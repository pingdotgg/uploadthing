import type { NextApiRequest, NextApiResponse } from "next";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";
import type { Json } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants.js";
import { formatError } from "./internal/error-formatter.js";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler.js";
import type { RouterWithConfig } from "./internal/handler.js";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard.js";
import type { FileRouter } from "./internal/types.js";
import type { CreateBuilderOptions } from "./internal/upload-builder.js";
import { createBuilder } from "./internal/upload-builder.js";

export type { FileRouter } from "./internal/types.js";

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
      req: Object.assign(req, {
        json: () =>
          Promise.resolve(
            typeof req.body === "string" ? JSON.parse(req.body) : req.body,
          ),
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
