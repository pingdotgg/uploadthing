import type { FastifyInstance, RouteHandlerMethod } from "fastify";

import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "../constants";
import { defaultErrorFormatter } from "./error-formatter";
import type { RouterWithConfig } from "./handler";
import { buildPermissionsInfoHandler, buildRequestHandler } from "./handler";
import type { FileRouter, inferErrorShape } from "./types";

export const fastifyUploadthingPlugin = <TRouter extends FileRouter>(
  fastify: FastifyInstance,
  opts: RouterWithConfig<TRouter>,
  done: (err?: Error) => void,
) => {
  const requestHandler = buildRequestHandler<TRouter, "fastify">(opts);

  fastify.register;

  const POST: RouteHandlerMethod = async (req, res) => {
    const response = await requestHandler({
      req: {
        ...req,
        headers: req.headers,
        url: req.url,
        json: () =>
          new Promise((resolve) => {
            resolve(req.body);
          }),
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

      void res
        .status(getStatusCodeFromError(response))
        .headers({
          "x-uploadthing-version": UPLOADTHING_VERSION,
        })
        .send(formattedError);
      return;
    }

    if (response.status !== 200) {
      // We messed up - this should never happen
      void res
        .status(500)
        .headers({
          "x-uploadthing-version": UPLOADTHING_VERSION,
        })
        .send("An unknown error occured");
    }

    void res
      .status(response.status)
      .headers({
        "x-uploadthing-version": UPLOADTHING_VERSION,
      })
      .send(response.body);
  };

  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const GET: RouteHandlerMethod = (_, res) => {
    void res
      .status(200)
      .headers({
        "x-uploadthing-version": UPLOADTHING_VERSION,
      })
      .send(getBuildPerms());
  };

  fastify.post("/api/uploadthing", POST).get("/api/uploadthing", GET);

  done();
};
