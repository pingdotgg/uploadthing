// This node import should be fine since it's available in both node and edge runtimes
// https://vercel.com/docs/functions/edge-functions/edge-runtime#compatible-node.js-modules
import EventEmitter from "events";
import type { NextApiRequest, NextApiResponse } from "next";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";
import type { Json } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { defaultErrorFormatter } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import type { RouterWithConfig } from "./internal/handler";
import type { FileRouter, inferErrorShape } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<"pages", TErrorShape>(opts);

export const createNextPageApiHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
) => {
  const ee = new EventEmitter();

  const requestHandler = buildRequestHandler<TRouter, "pages">(opts, ee);
  const errorFormatter =
    opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter ??
    defaultErrorFormatter;

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Return valid endpoints
    if (req.method === "GET") {
      const clientPollingKey = req.headers["x-uploadthing-polling-key"];
      if (clientPollingKey) {
        const eventData = await new Promise((resolve) => {
          ee.addListener("callbackDone", resolve);
        });
        ee.removeAllListeners("callbackDone");

        return new Response(JSON.stringify(eventData), {
          status: 200,
          headers: {
            "x-uploadthing-version": UPLOADTHING_VERSION,
          },
        });
      }

      const perms = getBuildPerms();
      res.status(200).json(perms);
      return;
    }

    const response = await requestHandler({
      req: Object.assign(req, {
        json: () =>
          Promise.resolve(
            JSON.parse(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              req.body,
            ),
          ),
      }),
      res,
    });

    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);

    if (response instanceof UploadThingError) {
      res.status(getStatusCodeFromError(response));
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      const formattedError = errorFormatter(
        response,
      ) as inferErrorShape<TRouter>;
      return res.json(formattedError);
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
