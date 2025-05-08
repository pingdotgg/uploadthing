import { Readable } from "node:stream";
import * as Effect from "effect/Effect";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { Router as ExpressRouter } from "express";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./_internal/handler";
import { getPostBody, toWebRequest } from "./_internal/to-web-request";
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
  req: ExpressRequest;
  res: ExpressResponse;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
): ExpressRouter => {
  const handler = makeAdapterHandler<
    [ExpressRequest, ExpressResponse],
    AdapterArgs
  >(
    (req, res) => Effect.succeed({ req, res }),
    (req) =>
      Effect.flatMap(getPostBody({ req }), (body) =>
        toWebRequest(req, body),
      ).pipe(Effect.orDie),
    opts,
    "express",
  );

  return ExpressRouter().all("/", async (req, res) => {
    const response = await handler(req, res);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) {
      // Slight type mismatch in `node:stream.ReadableStream` and Fetch's `ReadableStream`.
      Readable.fromWeb(response.body as never).pipe(res);
    } else {
      res.end();
    }
  });
};
