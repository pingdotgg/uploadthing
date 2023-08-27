import { Router as ExpressRouter } from "express";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { defaultErrorFormatter } from "./error-formatter";
import type { RouterWithConfig } from "./handler";
import { buildPermissionsInfoHandler, buildRequestHandler } from "./handler";
import { getPostBody } from "./node-http/getBody";
import type { FileRouter, inferErrorShape } from "./types";

export const createUploadthingExpressHandler = <TRouter extends FileRouter>(
  opts: RouterWithConfig<TRouter>,
): ExpressRouter => {
  const requestHandler = buildRequestHandler<TRouter, "express">(opts);
  const router = ExpressRouter();

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  router.post("/", async (req, res) => {
    const bodyResult = await getPostBody({
      req,
    });

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

    const { data } = bodyResult;

    const response = await requestHandler({
      req: {
        ...req,
        // Explicitly passing headers since
        // without that they are being lost for some reason
        headers: req.headers,
        json: () => new Promise((resolve) => resolve(data)),
      },
      res,
    });
    const errorFormatter =
      opts.router[Object.keys(opts.router)[0]]?._def.errorFormatter ??
      defaultErrorFormatter;

    if (response instanceof UploadThingError) {
      const formattedError = errorFormatter(
        response,
      ) as inferErrorShape<TRouter>;

      res.status(getStatusCodeFromError(response));
      res.setHeader("x-uploadthing-version", UPLOADTHING_VERSION);
      res.send(JSON.stringify(formattedError));

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
