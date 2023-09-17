import { Router as ExpressRouter } from "express";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { formatError } from "./internal/error-formatter";
import type { RouterWithConfig } from "./internal/handler";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import { getPostBody } from "./internal/node-http/getBody";
import type { FileRouter } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<{ req: ExpressRequest; res: ExpressResponse }, TErrorShape>(
    opts,
  );

export const createUploadthingExpressHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
): ExpressRouter => {
  const requestHandler = buildRequestHandler<TRouter>(opts);
  const router = ExpressRouter();

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post("/", async (req, res) => {
    const bodyResult = await getPostBody({ req });

    if (!bodyResult.ok) {
      res.status(400);
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      res.send(
        JSON.stringify({
          error: "BAD_REQUEST",
          message: bodyResult.error.message,
        }),
      );

      return;
    }

    const response = await requestHandler({
      req: Object.assign(req, {
        json: () => Promise.resolve(bodyResult.data),
      }),
      res,
    });

    if (response instanceof UploadThingError) {
      res.status(getStatusCodeFromError(response));
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      res.send(JSON.stringify(formatError(response, opts.router)));
      return;
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      res.status(500);
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      res.send("An unknown error occured");

      return;
    }

    res.status(response.status);
    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
    res.send(JSON.stringify(response.body));
  });

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  router.get("/", (_, res) => {
    res.status(200);
    res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
    res.send(JSON.stringify(getBuildPerms()));
  });

  return router;
};
