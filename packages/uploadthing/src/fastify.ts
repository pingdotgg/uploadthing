import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./internal/config";
import { formatError } from "./internal/error-formatter";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
  runRequestHandlerAsync,
} from "./internal/handler";
import { toWebRequest } from "./internal/to-web-request";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

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
  opts: RouteHandlerOptions<TRouter>,
  done: (err?: Error) => void,
) => {
  const requestHandler = buildRequestHandler<TRouter, MiddlewareArgs>(
    opts,
    "fastify",
  );
  const getBuildPerms = buildPermissionsInfoHandler<TRouter>(opts);

  const POST: RouteHandlerMethod = async (req, res) => {
    const response = await runRequestHandlerAsync(
      requestHandler,
      {
        req: toWebRequest(req),
        middlewareArgs: { req, res, event: undefined },
      },
      opts.config,
    );

    if (response.success === false) {
      void res
        .status(getStatusCodeFromError(response.error))
        .headers({ "x-uploadthing-version": UPLOADTHING_VERSION })
        .send(formatError(response.error, opts.router));
      return;
    }

    void res
      .headers({ "x-uploadthing-version": UPLOADTHING_VERSION })
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
