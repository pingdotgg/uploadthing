import * as Effect from "effect/Effect";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./_internal/handler";
import { toWebRequest } from "./_internal/to-web-request";
import type { CreateBuilderOptions } from "./_internal/upload-builder";
import { createBuilder } from "./_internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export {
  UTFiles,
  /**
   * This is an experimental feature.
   * You need to be feature flagged on our backend to use this
   */
  UTRegion as experimental_UTRegion,
} from "./_internal/types";
export type { FileRouter };

type AdapterArgs = {
  req: FastifyRequest;
  res: FastifyReply;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  fastify: FastifyInstance,
  opts: RouteHandlerOptions<TRouter>,
  done: (err?: Error) => void,
) => {
  const handler = makeAdapterHandler<
    [FastifyRequest, FastifyReply],
    AdapterArgs
  >(
    (req, res) => Effect.succeed({ req, res }),
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
