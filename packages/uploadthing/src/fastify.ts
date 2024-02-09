import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants";
import { formatError } from "./internal/error-formatter";
import type { RouterWithConfig } from "./internal/handler";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard";
import { initLogger } from "./internal/logger";
import { toWebRequest } from "./internal/node-http/toWebRequest";
import type { FileRouter } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter };
export { UTFiles } from "./internal/types";

type MiddlewareArgs = {
  req: FastifyRequest;
  res: FastifyReply;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  fastify: FastifyInstance,
  opts: RouterWithConfig<TRouter>,
  done: (err?: Error) => void,
) => {
  initLogger(opts.config?.logLevel);
  incompatibleNodeGuard();

  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    "fastify",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const POST: RouteHandlerMethod = async (req, res) => {
    const response = await requestHandler({
      nativeRequest: toWebRequest(req),
      originalRequest: req,
      res,
      event: undefined,
    });

    if (response instanceof UploadThingError) {
      void res
        .status(getStatusCodeFromError(response))
        .headers({
          "x-uploadthing-version": UPLOADTHING_VERSION,
        })
        .send(formatError(response, opts.router));
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

  const GET: RouteHandlerMethod = async (req, res) => {
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

/**
 * @deprecated Use {@link createRouteHandler} instead
 */
export const fastifyUploadthingPlugin = createRouteHandler;
