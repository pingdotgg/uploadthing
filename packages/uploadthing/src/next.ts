import type { NextRequest } from "next/server";
import { HttpApp, HttpClient } from "@effect/platform";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { createRequestHandler, MiddlewareArguments } from "./internal/handler";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter };
export { UTFiles } from "./internal/types";

type MiddlewareArgs = { req: NextRequest; res: undefined; event: undefined };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const requestHandler = Effect.runSync(
    createRequestHandler<TRouter>(opts, "nextjs-app"),
  );

  const handler = (request: NextRequest) => {
    return HttpApp.toWebHandler(
      requestHandler.pipe(
        Effect.provideService(MiddlewareArguments, {
          req: request,
          res: undefined,
          event: undefined,
        } satisfies MiddlewareArgs),
        // v-- why do i need to re-provide?
        Effect.provide(HttpClient.layer),
        // Effect.provide(Layer.setConfigProvider(configProvider(opts.config))),
        // .... other stuff
      ),
    )(request);
  };

  return { POST: handler, GET: handler };
};
