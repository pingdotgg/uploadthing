import type { ActionFunctionArgs } from "@remix-run/server-runtime";
import * as Effect from "effect/Effect";

import type { Json } from "@uploadthing/shared";

import { makeAdapterHandler } from "./internal/handler";
import type { FileRouter, RouteHandlerOptions } from "./internal/types";
import type { CreateBuilderOptions } from "./internal/upload-builder";
import { createBuilder } from "./internal/upload-builder";

export type { FileRouter };
export { UTFiles } from "./internal/types";

type MiddlewareArgs = {
  req: Request;
  res: undefined;
  event: ActionFunctionArgs;
};

export const createUploadthing = <TErrorShape extends Json>(
  opts?: CreateBuilderOptions<TErrorShape>,
) => createBuilder<MiddlewareArgs, TErrorShape>(opts);

export const createRouteHandler = <TRouter extends FileRouter>(
  opts: RouteHandlerOptions<TRouter>,
) => {
  const handler = makeAdapterHandler<[ActionFunctionArgs]>(
    (args) =>
      Effect.succeed({ req: args.request, res: undefined, event: args }),
    (args) => Effect.succeed(args.request),
    opts,
    "remix",
  );
  return { action: handler, loader: handler };
};
