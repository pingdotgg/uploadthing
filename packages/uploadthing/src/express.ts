import { Readable } from "node:stream";
import * as Effect from "effect/Effect";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { Router as ExpressRouter } from "express";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
import { getPostBody, toWebRequest } from "./internal/to-web-request";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";
import type { FileRouter, RouteHandlerOptions } from "./types";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type AdapterArgs = {
  req: ExpressRequest;
  res: ExpressResponse;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<AdapterArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
): ExpressRouter => {
  const handler = makeAdapterHandler<[ExpressRequest, ExpressResponse]>(
    (req, res) => Effect.succeed({ req, res, event: undefined }),
    (req) =>
      Effect.flatMap(getPostBody({ req }), (body) =>
        toWebRequest(req, body),
      ).pipe(Effect.orDie),
    opts,
    "express",
  );

  return ExpressRouter().all(
    "/",
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req, res) => {
      const response = await handler(req, res);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (!response.body) return res.end();
      // Slight type mismatch in `node:stream.ReadableStream` and Fetch's `ReadableStream`.
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return Readable.fromWeb(response.body as any).pipe(res);
    },
  );
};
