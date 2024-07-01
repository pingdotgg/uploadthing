import type { NextApiRequest, NextApiResponse } from "next";
import { HttpApp, HttpClient } from "@effect/platform";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { createRequestHandler, MiddlewareArguments } from "./internal/handler";
import { toWebRequest } from "./internal/to-web-request";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = {
  req: NextApiRequest;
  res: NextApiResponse;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const requestHandler = Effect.runSync(
    createRequestHandler<TRouter>(opts, "nextjs-app"),
  );

  return async (req: NextApiRequest, res: NextApiResponse) => {
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
    res.status(response.status);
    for (const [name, value] of response.headers) {
      res.setHeader(name, value);
    }
    return res.json(response.body);
  };
};
