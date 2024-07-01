import { HttpApp, HttpClient } from "@effect/platform";
import * as Effect from "effect/Effect";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { Router as ExpressRouter } from "express";

import type { Json } from "@uploadthing/shared";

import { createRequestHandler, MiddlewareArguments } from "./internal/handler";
import { getPostBody, toWebRequest } from "./internal/to-web-request";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = {
  req: ExpressRequest;
  res: ExpressResponse;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
): ExpressRouter => {
  const requestHandler = Effect.runSync(
    createRequestHandler<TRouter>(opts, "express"),
  );

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return ExpressRouter().all("/", async (req, res) => {
    const request = await Effect.runPromise(
      Effect.flatMap(getPostBody({ req }), (body) => toWebRequest(req, body)),
    );
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
    res.status(response.status);
    for (const [name, value] of response.headers) {
      res.setHeader(name, value);
    }
    res.send(response.body);
  });
};
