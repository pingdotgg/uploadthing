import { HttpApp, HttpClient } from "@effect/platform";
import * as Effect from "effect/Effect";
import type { H3Event } from "h3";
import { defineEventHandler, toWebRequest } from "h3";

import type { Json } from "@uploadthing/shared";

import { createRequestHandler, MiddlewareArguments } from "./internal/handler";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = { req: undefined; res: undefined; event: H3Event };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const requestHandler = Effect.runSync(
    createRequestHandler<TRouter>(opts, "h3"),
  );

  return defineEventHandler(async (event) => {
    const request = toWebRequest(event);
    return HttpApp.toWebHandler(
      requestHandler.pipe(
        Effect.provideService(MiddlewareArguments, {
          req: undefined,
          res: undefined,
          event,
        } satisfies MiddlewareArgs),
        Effect.provide(HttpClient.layer),
      ),
    )(request);
  });
};
