import * as Effect from "effect/Effect";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
import { toWebRequest } from "./internal/to-web-request";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type AdapterArgs = {
  req: FastifyRequest;
  res: FastifyReply;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  fastify: FastifyInstance,
  opts: RouteHandlerOptions<TRouter>,
  done: (err?: Error) => void,
) => {
  const handler = makeAdapterHandler<[FastifyRequest, FastifyReply]>(
    (req, res) => Effect.succeed({ req, res, event: undefined }),
    (req) => toWebRequest(req),
    opts,
    "fastify",
  );

  fastify.all("/api/uploadthing", async (req, res) => {
    const response = await handler(req, res);
    return res
      .status(response.status)
      .headers(Object.fromEntries(response.headers))
      .send(response.body);
  });

  done();
};
