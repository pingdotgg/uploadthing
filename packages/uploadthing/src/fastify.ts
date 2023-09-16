import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { defaultErrorFormatter } from "./internal/error-formatter";
import type { RouterWithConfig } from "./internal/handler";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import type { FileRouter, inferErrorShape } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter } from "./internal/types";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<{ req: FastifyRequest; res: FastifyReply }, TErrorShape>(opts);

export const fastifyUploadthingPlugin = <TRouter extends FileRouter>(
  fastify: FastifyInstance,
  opts: RouterWithConfig<TRouter>,
  done: (err?: Error) => void,
) => {
  const requestHandler = buildRequestHandler<TRouter, "fastify">(opts);

  const POST: RouteHandlerMethod = async (req, res) => {
    const response = await requestHandler({
      req: Object.assign(req, {
        json: () => Promise.resolve(req.body),
      }),
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
      return;
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
