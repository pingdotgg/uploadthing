import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";
import { UploadThingError } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
import { extractRouterConfig as extractEffect } from "./internal/route-config";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export { UTFiles } from "./internal/types";
export { UTApi } from "./sdk";
export { UTFile } from "./sdk/ut-file";
export { UploadThingError, type FileRouter };

type MiddlewareArgs = { req: Request; res: undefined; event: undefined };

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  return makeAdapterHandler<[Request]>(
    (req) => Effect.succeed({ req, res: undefined, event: undefined }),
    (req) => Effect.succeed(req),
    opts,
    "server",
  );
};

export const extractRouterConfig = (router: FileRouter) =>
  Effect.runSync(extractEffect(router));
