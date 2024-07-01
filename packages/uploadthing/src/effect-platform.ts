import { HttpRouter, HttpServerRequest } from "@effect/platform";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { createRequestHandler, MiddlewareArguments } from "./internal/handler";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export type { FileRouter };

type MiddlewareArgs = {
  req: HttpServerRequest.HttpServerRequest;
  res: undefined;
  event: undefined;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  // const handler = makeThing<[HttpServerRequest]>(
  //   (_) => Effect.succeed({ req: _, res: undefined, event: undefined }),
  //   (_) => _.source as Request,
  //   opts,
  //   "effect-platform",
  // );

  const requestHandler = Effect.runSync(
    createRequestHandler<TRouter>(opts, "effect-platform"),
  );

  return HttpRouter.provideServiceEffect(
    requestHandler,
    MiddlewareArguments,
    Effect.map(HttpServerRequest.HttpServerRequest, (serverRequest) => ({
      req: serverRequest,
      res: undefined,
      event: undefined,
    })),
  );
};
