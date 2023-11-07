import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
  RouteHandlerMethod,
} from "fastify";

import type { Json } from "@uploadthing/shared";
import { getStatusCodeFromError, UploadThingError } from "@uploadthing/shared";

import { UPLOADTHING_VERSION } from "./constants.js";
import { formatError } from "./internal/error-formatter.js";
import type { RouterWithConfig } from "./internal/handler.js";
import {
  buildPermissionsInfoHandler,
  buildRequestHandler,
} from "./internal/handler.js";
import { incompatibleNodeGuard } from "./internal/incompat-node-guard.js";
import type { FileRouter } from "./internal/types.js";
import type { CreateBuilderOptions } from "./internal/upload-builder.js";
import { createBuilder } from "./internal/upload-builder.js";

export type { FileRouter } from "./internal/types.js";

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) =>
  createBuilder<
    { req: FastifyRequest; res: FastifyReply; event: undefined },
    TErrorShape
  >(opts);

export const fastifyUploadthingPlugin = <TRouter extends FileRouter>(
  fastify: FastifyInstance,
  opts: RouterWithConfig<TRouter>,
  done: (err?: Error) => void,
) => {
  incompatibleNodeGuard();
  const requestHandler = buildRequestHandler<TRouter>(opts);

  const POST: RouteHandlerMethod = async (req, res) => {
    const proto = (req.headers["x-forwarded-proto"] as string) ?? "http";
    const url = new URL(req.url, `${proto}://${req.headers.host}`);

    const response = await requestHandler({
      req: Object.assign(req, {
        json: () => Promise.resolve(req.body),
      }),
      url,
      res,
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
