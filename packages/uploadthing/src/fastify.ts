import { HttpApp, HttpClient } from "@effect/platform";
import * as Effect from "effect/Effect";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { Json } from "@uploadthing/shared";

import { createRequestHandler, MiddlewareArguments } from "./internal/handler";
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
  const requestHandler = Effect.runSync(
    createRequestHandler<TRouter>(opts, "fastify"),
  );

  fastify.all("/api/uploadthing", async (req, res) => {
    const request = await Effect.runPromise(toWebRequest(req));
    const response = await HttpApp.toWebHandler(
      requestHandler.pipe(
        Effect.provideService(MiddlewareArguments, {
          req: req,
          res: res,
          event: undefined,
        } satisfies MiddlewareArgs),
        Effect.provide(HttpClient.layer),
      ),
    )(request);
    return res
      .status(response.status)
      .headers(Object.fromEntries(response.headers))
      .send(response.body);
  });

  done();
};
