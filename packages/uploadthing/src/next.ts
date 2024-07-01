import type { NextRequest } from "next/server";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
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
  const handler = makeAdapterHandler<[NextRequest]>(
    (req) => Effect.succeed({ req, res: undefined, event: undefined }),
    (req) => Effect.succeed(req),
    opts,
    "nextjs-app",
  );
  return { POST: handler, GET: handler };
};
